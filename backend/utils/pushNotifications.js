const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const { sendMulticastFcmMessages } = require('./firebaseMessaging');

const sendBrowserPush = async (subscription, payload) => {
  try {
    const webPush = require('web-push');
    const vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };

    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      console.warn('⚠️ VAPID keys are not configured. Skipping browser push delivery.');
      return { skipped: true, reason: 'vapid-missing' };
    }

    webPush.setVapidDetails('mailto:info@delivo.buzz', vapidKeys.publicKey, vapidKeys.privateKey);
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    console.error('❌ Browser push delivery failed', error.message);
    return { ok: false, error };
  }
};

const buildNotificationPayload = ({ eventType, order, recipientRole, extra = {} }) => {
  const orderId = order?._id?.toString?.() || order?.id || 'unknown';
  const orderIdShort = orderId.slice(-6);
  const customerName = order?.customerName || 'Customer';
  const restaurantName = order?.restaurantId?.name || 'restaurant';
  const amount = typeof order?.totalPrice === 'number' ? `KES ${order.totalPrice}` : 'an order';
  const items = order?.items || [];
  const deliveryAddress = order?.deliveryAddress || '';

  const templates = {
    order_created: {
      title: 'New order received',
      message: `${customerName} placed a new order for ${amount} at ${restaurantName}.`,
    },
    order_placed_customer: {
      title: 'Order Confirmed',
      message: `Your order #${orderIdShort} has been received successfully. We're preparing your delivery.`,
    },
    order_assigned_rider: {
      title: 'New delivery assignment',
      message: `You have a new delivery assignment for order #${orderIdShort}. Customer: ${customerName}`,
    },
    order_status_update: {
      title: 'Order Status Updated',
      message: `Order #${orderIdShort} status has been updated.`,
    },
    order_confirmed: {
      title: 'Order Confirmed',
      message: `Order #${orderIdShort} has been confirmed and is being prepared.`,
    },
    order_preparing: {
      title: 'Order Being Prepared',
      message: `Your order #${orderIdShort} is being prepared at the restaurant.`,
    },
    order_on_delivery: {
      title: 'Order On The Way',
      message: `Your order #${orderIdShort} is on its way to ${deliveryAddress}.`,
    },
    order_delivered: {
      title: 'Order Delivered',
      message: `Your order #${orderIdShort} has been successfully delivered.`,
    },
  };


  const template = templates[eventType] || templates.order_status_update;
  const itemSummary = items.slice(0, 3).map((item) => `${item.quantity} x ${item.foodId?.name || 'Item'}`).join(', ');

  return {
    title: template.title,
    message: template.message,
    icon: '/favicon.ico',
    url: '/orders',
    data: {
      eventType,
      recipientRole,
      orderId,
      customerName,
      restaurantName,
      amount: order?.totalPrice || 0,
      itemCount: items.length,
      itemSummary,
      deliveryAddress,
      ...extra,
    },
  };
};

const createInAppNotification = async ({ userId, title, message, type = 'system' }) => {
  if (!userId) return null;

  return Notification.create({
    title,
    message,
    type,
    userId,
  });
};

const sendPushToUser = async ({ userId, payload }) => {
  if (!userId) return { sent: 0, total: 0 };

  try {
    const subscriptions = await PushSubscription.find({ userId, isActive: true });
    if (!subscriptions.length) return { sent: 0, total: 0 };

    const webPushSubscriptions = subscriptions.filter((s) => s.endpoint && s.keys?.p256dh && s.keys?.auth);
    const fcmTokens = subscriptions.filter((s) => s.fcmToken).map((s) => s.fcmToken);

    let totalSent = 0;

    if (webPushSubscriptions.length > 0) {
      const webResults = await Promise.all(
        webPushSubscriptions.map((subscription) => sendBrowserPush(subscription, payload))
      );
      totalSent += webResults.filter((result) => result.ok).length;
    }

    if (fcmTokens.length > 0) {
      const fcmResult = await sendMulticastFcmMessages({ fcmTokens, payload });
      totalSent += fcmResult.sent;

      if (fcmResult.invalidTokens.length > 0) {
        try {
          await PushSubscription.updateMany(
            { fcmToken: { $in: fcmResult.invalidTokens } },
            { isActive: false }
          );
          console.log(`⚠️ Marked ${fcmResult.invalidTokens.length} invalid FCM tokens as inactive`);
        } catch (error) {
          console.error('❌ Failed to mark invalid tokens:', error.message);
        }
      }
    }

    return { sent: totalSent, total: subscriptions.length };
  } catch (error) {
    console.error('❌ Error sending push notifications:', error.message);
    return { sent: 0, total: 0 };
  }
};

const dispatchOrderNotifications = async ({ order, recipientUsers = [], recipientRoles = [], restaurantUserId, adminUserId, riderUserId }) => {
  const orderId = order?._id?.toString?.() || order?.id || 'unknown';
  const populatedOrder = order && order.restaurantId && typeof order.restaurantId === 'object' ? order : { ...order };

  const recipients = [];

  if (adminUserId) recipients.push({ userId: adminUserId, role: 'admin' });
  if (restaurantUserId) recipients.push({ userId: restaurantUserId, role: 'restaurant' });
  if (riderUserId) recipients.push({ userId: riderUserId, role: 'rider' });

  for (const recipient of recipientUsers) {
    recipients.push(recipient);
  }

  const uniqueRecipientIds = Array.from(
    new Map(
      recipients
        .filter(({ userId }) => userId)
        .map((recipient) => [recipient.userId.toString(), recipient])
    ).values()
  );

  for (const recipient of uniqueRecipientIds) {
    const payload = buildNotificationPayload({
      eventType: recipient.role === 'customer' ? 'order_placed_customer' : 'order_created',
      order,
      recipientRole: recipient.role,
      extra: { orderId },
    });

    await createInAppNotification({
      userId: recipient.userId,
      title: payload.title,
      message: payload.message,
      type: 'order',
    });

    await sendPushToUser({ userId: recipient.userId, payload });
  }

  return { recipients: uniqueRecipientIds };
};

const sendOrderPaymentNotification = async (order, status) => {
  if (!order) return;
  const orderIdShort = order._id ? order._id.toString().slice(-6).toUpperCase() : 'ORDER';
  const amountStr = order.totalPrice ? `KES ${order.totalPrice}` : '';

  let title = '';
  let message = '';

  if (status === 'completed' || status === 'confirmed') {
    title = 'Payment Confirmed';
    message = `Your M-Pesa payment of ${amountStr} for order #${orderIdShort} was confirmed. The restaurant is preparing your food.`;
  } else if (status === 'failed' || status === 'cancelled') {
    title = 'Payment Failed';
    message = `M-Pesa payment for order #${orderIdShort} failed or was cancelled. Please try again from your cart.`;
  } else {
    title = 'Order Placed';
    message = `Order #${orderIdShort} created. Check your phone for the M-Pesa PIN prompt.`;
  }

  const payload = {
    title,
    message,
    icon: '/delivos.png',
    badge: '/delivos.png',
    url: '/customer/orders',
    tag: 'delivo-order-payment',
  };

  try {
    if (order.userId) {
      await createInAppNotification({
        userId: order.userId,
        title,
        message,
        type: 'order',
      });
      await sendPushToUser({ userId: order.userId, payload });
    } else {
      console.log('Skipping push notification for guest checkout order');
    }
  } catch (err) {
    console.error('❌ Error sending order payment notification:', err.message);
  }
};


module.exports = {
  buildNotificationPayload,
  createInAppNotification,
  sendPushToUser,
  dispatchOrderNotifications,
  sendBrowserPush,
  sendOrderPaymentNotification,
};

