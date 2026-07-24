const Notification = require('../models/Notification');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');
const { sendMulticastFcmMessages } = require('../utils/firebaseMessaging');
const { sendPushToUser } = require('../utils/pushNotifications');

const buildAdminNotificationPayload = ({ title, message, type, notificationId }) => ({
  title,
  message,
  icon: '/favicon.ico',
  url: '/notifications',
  data: {
    type,
    notificationId,
  },
});

const sendPushToAllActiveSubscriptions = async (payload) => {
  const subscriptions = await PushSubscription.find({ isActive: true });
  if (!subscriptions.length) {
    return { sent: 0, total: 0 };
  }

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
};

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

    webPush.setVapidDetails(
      'mailto:info@delivo.buzz',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    const pushOptions = {
      TTL: 60,
      urgency: 'high',
      headers: {
        Urgency: 'high',
      },
    };

    await webPush.sendNotification(subscription, JSON.stringify(payload), pushOptions);
    console.log(`⚡ Instant Web Push sent to endpoint: ${subscription.endpoint.substring(0, 35)}...`);
    return { ok: true };

  } catch (error) {
    console.error('❌ Browser push delivery failed:', error.statusCode, error.message);

    // If subscription is expired (410 Gone or 404 Not Found), deactivate it
    if (error.statusCode === 410 || error.statusCode === 404) {
      try {
        await PushSubscription.updateOne({ _id: subscription._id }, { isActive: false });
        console.log(`⚠️ Deactivated expired push subscription (${subscription._id})`);
      } catch (dbErr) {
        // ignore db error
      }
    }

    return { ok: false, error: error.message };
  }
};


// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user notifications only (broadcast is created per user by admin broadcast controller)
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

// Create notification (Admin only)
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;

    // Verify user is admin
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create notifications',
      });
    }

    // Create notification
    const notification = await Notification.create({
      title,
      message,
      type: type || 'system',
      userId: userId || null, // null = broadcast to all
    });

    const payload = buildAdminNotificationPayload({
      title,
      message,
      type: type || 'system',
      notificationId: notification._id.toString(),
    });

    if (userId) {
      await sendPushToUser({ userId, payload });
    } else {
      await sendPushToAllActiveSubscriptions(payload);
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message,
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message,
    });
  }
};

// Mark all notifications as read for current user
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message,
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};

// Delete all notifications for user
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({
      $or: [
        { userId },
        { userId: null }, // Delete broadcast notifications too
      ],
    });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notifications',
      error: error.message,
    });
  }
};

exports.savePushSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { endpoint, keys, fcmToken, platform } = req.body || {};

    if (!endpoint && !fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'Subscription data is incomplete.',
      });
    }

    const effectivePlatform = platform || 'web';

    if (userId && endpoint) {
      await PushSubscription.updateMany(
        {
          userId,
          platform: effectivePlatform,
          endpoint: { $ne: endpoint },
          isActive: true,
        },
        { $set: { isActive: false } }
      );
    }

    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        endpoint,
        keys: endpoint
          ? {
              p256dh: keys?.p256dh,
              auth: keys?.auth,
            }
          : undefined,
        fcmToken,
        platform: effectivePlatform,
        userId,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Push subscription saved.',
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving push subscription.',
      error: error.message,
    });
  }
};

exports.sendPushNotification = async (req, res) => {
  try {
    const { title, message, userId } = req.body || {};

    const payload = {
      title: title || 'Delivo update',
      message: message || 'You have a new update from Delivo.',
      url: '/',
    };

    if (userId) {
      const result = await sendPushToUser({ userId, payload });
      return res.status(200).json({
        success: true,
        message: 'Push notifications dispatched.',
        sent: result.sent,
        total: result.total,
      });
    }

    const subscriptions = await PushSubscription.find({ isActive: true });

    if (!subscriptions.length) {
      return res.status(200).json({
        success: true,
        message: 'No active push subscriptions found.',
        sent: 0,
      });
    }

    const results = await Promise.all(subscriptions.map((subscription) => sendBrowserPush(subscription, payload)));

    res.status(200).json({
      success: true,
      message: 'Push notifications dispatched.',
      sent: results.filter((result) => result.ok).length,
      total: subscriptions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending push notifications.',
      error: error.message,
    });
  }
};

exports.registerFcmToken = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { fcmToken, platform = 'web' } = req.body || {};

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required.',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      });
    }

    await PushSubscription.updateMany(
      {
        userId,
        platform,
        fcmToken: { $ne: fcmToken },
        isActive: true,
      },
      { $set: { isActive: false } }
    );

    const subscription = await PushSubscription.findOneAndUpdate(
      { fcmToken },
      {
        fcmToken,
        platform,
        userId,
        isActive: true,
        endpoint: null,
        keys: { p256dh: null, auth: null },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ FCM token registered for user ${userId}`);

    try {
      const { sendFcmMessage } = require('../utils/firebaseMessaging');
      const user = await require('../models/User').findById(userId);

      if (user && !user.welcomeNotificationSent) {
        const welcomePayload = {
          title: 'Welcome to Delivo! 🎉',
          message: `Hi ${user.name}, your account has been created successfully. Start ordering your favorite food now!`,
          data: {
            eventType: 'account_created',
            userId: userId.toString(),
            recipientRole: 'customer',
            clickAction: '/restaurants',
          },
          url: '/restaurants',
        };

        await sendFcmMessage({ fcmToken, payload: welcomePayload });
        user.welcomeNotificationSent = true;
        await user.save();
        console.log(`✅ Welcome notification sent to new user ${userId} after FCM registration`);
      }
    } catch (pushError) {
      console.warn(`⚠️ Welcome notification failed for user ${userId}:`, pushError.message);
    }

    res.status(200).json({
      success: true,
      message: 'FCM token registered successfully.',
      subscription,
    });
  } catch (error) {
    console.error('❌ Error registering FCM token:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error registering FCM token.',
      error: error.message,
    });
  }
};

exports.sendTestNotification = async (req, res) => {
  try {
    const { fcmToken } = req.body || {};

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required for testing.',
      });
    }

    const { sendFcmMessage } = require('../utils/firebaseMessaging');

    const testPayload = {
      title: 'Test Notification from Delivo',
      message: 'If you see this, Firebase push notifications are working! 🎉',
      data: {
        eventType: 'test',
        orderId: 'test-notification',
        recipientRole: 'test',
        clickAction: '/notifications',
      },
      url: '/notifications',
    };

    console.log('📨 Sending test FCM notification...');
    const result = await sendFcmMessage({ fcmToken, payload: testPayload });

    if (result.ok) {
      console.log('✅ Test notification sent successfully:', result.messageId);
      return res.status(200).json({
        success: true,
        message: 'Test notification sent successfully!',
        messageId: result.messageId,
      });
    }

    console.error('❌ Test notification failed:', result.error?.message);
    res.status(400).json({
      success: false,
      message: 'Failed to send test notification.',
      error: result.error?.message || 'Unknown error',
    });
  } catch (error) {
    console.error('❌ Error sending test notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error sending test notification.',
      error: error.message,
    });
  }
};

exports.sendAdminNotification = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { title, message, targetType = 'all', targetUserIds = [], targetRole } = req.body || {};

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required.',
      });
    }

    // Verify user is admin (optional - adjust based on your auth system)
    const User = require('../models/User');
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send notifications.',
      });
    }

    const { sendMulticastFcmMessages } = require('../utils/firebaseMessaging');
    const Notification = require('../models/Notification');

    let targetUsers = [];

    // Determine target users
    if (targetType === 'all') {
      targetUsers = await User.find({}, '_id');
    } else if (targetType === 'role' && targetRole) {
      targetUsers = await User.find({ role: targetRole }, '_id');
    } else if (targetType === 'specific' && targetUserIds.length > 0) {
      targetUsers = await User.find({ _id: { $in: targetUserIds } }, '_id');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type or no target users specified.',
      });
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No target users found.',
      });
    }

    const notificationPayload = {
      title,
      message,
      data: {
        eventType: 'admin_broadcast',
        sentBy: adminId.toString(),
        sentAt: new Date().toISOString(),
        clickAction: '/notifications',
      },
      url: '/notifications',
    };

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Send to each user
    for (const user of targetUsers) {
      try {
        // Get user's FCM tokens
        const subscriptions = await PushSubscription.find({
          userId: user._id,
          isActive: true,
          fcmToken: { $exists: true, $ne: null },
        }).select('fcmToken');

        if (subscriptions.length > 0) {
          const fcmTokens = subscriptions.map((s) => s.fcmToken);
          const result = await sendMulticastFcmMessages({
            fcmTokens,
            payload: notificationPayload,
          });

          if (result.sent > 0) {
            sentCount += result.sent;
          }
          if (result.failed > 0) {
            failedCount += result.failed;
          }
        }

        // Create in-app notification record
        await Notification.create({
          userId: user._id,
          title,
          message,
          type: 'admin_broadcast',
          isRead: false,
        });
      } catch (userError) {
        failedCount++;
        errors.push(`Error sending to user ${user._id}: ${userError.message}`);
      }
    }

    console.log(`✅ Admin broadcast notification sent: ${sentCount} push, ${targetUsers.length} in-app`);

    res.status(200).json({
      success: true,
      message: 'Admin notification sent successfully!',
      stats: {
        targetedUsers: targetUsers.length,
        pushSent: sentCount,
        pushFailed: failedCount,
        inAppCreated: targetUsers.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Error sending admin notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error sending admin notification.',
      error: error.message,
    });
  }
};

// Public endpoint for registering browser push subscriptions (allows guest / testing users)
exports.savePushSubscriptionPublic = async (req, res) => {
  try {
    const { endpoint, keys, platform } = req.body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        message: 'Subscription endpoint and keys are required.',
      });
    }

    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        platform: platform || 'web',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('✅ Public Web Push subscription registered:', endpoint.substring(0, 30));

    res.status(200).json({
      success: true,
      message: 'Web push subscription saved successfully.',
      subscription,
    });
  } catch (error) {
    console.error('❌ Error saving public push subscription:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error saving push subscription.',
      error: error.message,
    });
  }
};

// Public endpoint to trigger real Web Push from backend server to the target device endpoint
exports.sendPushNotificationPublic = async (req, res) => {
  try {
    const { endpoint, title, message, tag } = req.body || {};
    const timeStr = new Date().toLocaleTimeString();
    const payload = {
      title: title || 'Delivo Notification',
      message: message || `Notification received from server at ${timeStr}.`,
      tag: tag || 'delivo-alert',
      url: '/',
    };


    let subscriptions = [];
    if (endpoint) {
      subscriptions = await PushSubscription.find({ endpoint, isActive: true });
    }

    if (!subscriptions.length) {
      subscriptions = await PushSubscription.find({ isActive: true, endpoint: { $ne: null } })
        .sort({ updatedAt: -1 })
        .limit(1);
    }

    if (!subscriptions.length) {
      return res.status(200).json({
        success: true,
        message: 'No active web push subscription found.',
        sent: 0,
      });
    }



    const results = await Promise.all(subscriptions.map((subscription) => sendBrowserPush(subscription, payload)));
    const sentCount = results.filter((r) => r.ok).length;

    console.log(`✅ Real Web Push dispatched to ${sentCount}/${subscriptions.length} subscribers`);

    res.status(200).json({
      success: true,
      message: 'Push notifications dispatched from server.',
      sent: sentCount,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('❌ Error sending public push notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error sending push notification.',
      error: error.message,
    });
  }
};


// Debug: return push subscriptions for the authenticated user
exports.getMyPushSubscriptions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const subs = await PushSubscription.find({ userId });
    res.status(200).json({ success: true, subscriptions: subs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions', error: error.message });
  }
};

// Debug: return all push subscriptions (development only)
exports.debugAllPushSubscriptions = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Forbidden in production' });
    }
    const subs = await PushSubscription.find({}).limit(200).lean();
    res.status(200).json({ success: true, total: subs.length, subscriptions: subs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions', error: error.message });
  }
};




