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

    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    console.error('❌ Browser push delivery failed', error.message);
    return { ok: false, error };
  }
};

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user notifications + broadcast notifications (userId is null)
    const notifications = await Notification.find({
      $or: [
        { userId },
        { userId: null }, // Broadcast notifications
      ],
    })
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

    const subscription = await PushSubscription.findOneAndUpdate(
      { $or: [{ endpoint }, { fcmToken }] },
      {
        endpoint: endpoint || undefined,
        keys: endpoint
          ? {
              p256dh: keys?.p256dh,
              auth: keys?.auth,
            }
          : undefined,
        fcmToken,
        platform: platform || 'web',
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

    const subscription = await PushSubscription.findOneAndUpdate(
      { fcmToken },
      {
        fcmToken,
        platform,
        userId,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ FCM token registered for user ${userId}`);

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

