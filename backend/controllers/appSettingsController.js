const AppSettings = require('../models/AppSettings');
const User = require('../models/User');

// Ensure a singleton app settings document exists
const getSingletonSettings = async () => {
  let settings = await AppSettings.findOne();
  if (!settings) {
    settings = await AppSettings.create({});
  }
  return settings;
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getSingletonSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load app settings',
      error: error.message,
    });
  }
};

const dispatchFreeDeliveryPromo = async () => {
  try {
    const PushSubscription = require('../models/PushSubscription');
    const { sendMulticastFcmMessages } = require('../utils/firebaseMessaging');
    const webPush = require('web-push');

    const payload = {
      title: 'Free Delivery Active! 🎁',
      message: 'Delivo is offering FREE delivery on all orders today! Place your order and satisfy your cravings.',
      icon: '/delivo.jpg',
      badge: '/delivo.jpg',
      url: '/menu',
    };

    const subscriptions = await PushSubscription.find({ isActive: true });
    const webPushSubscriptions = subscriptions.filter((s) => s.endpoint && s.keys?.p256dh && s.keys?.auth);
    const fcmTokens = subscriptions.filter((s) => s.fcmToken).map((s) => s.fcmToken);

    // Send Web Push
    if (webPushSubscriptions.length > 0) {
      const vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_ACCESS_KEY || process.env.VAPID_PRIVATE_KEY,
      };

      if (vapidKeys.publicKey && vapidKeys.privateKey) {
        webPush.setVapidDetails('mailto:info@delivo.buzz', vapidKeys.publicKey, vapidKeys.privateKey);
        webPushSubscriptions.forEach((sub) => {
          webPush.sendNotification(sub, JSON.stringify(payload)).catch(() => {});
        });
      }
    }

    // Send FCM Multicast
    if (fcmTokens.length > 0) {
      sendMulticastFcmMessages({ fcmTokens, payload }).catch(() => {});
    }

    // Create in-app notification for all users
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const allUsers = await User.find({}, '_id');
    if (allUsers.length > 0) {
      const inAppNotifications = allUsers.map((u) => ({
        userId: u._id,
        title: payload.title,
        message: payload.message,
        type: 'promotion',
      }));
      await Notification.insertMany(inAppNotifications);
    }
    console.log(`📡 Broadcasted Free Delivery Promo Notification to ${subscriptions.length} subscribers and ${allUsers.length} users`);
  } catch (error) {
    console.error('❌ Failed to dispatch free delivery promo:', error.message);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update app settings',
      });
    }

    const previousSettings = await AppSettings.findOne();
    const prevEnabled = previousSettings ? previousSettings.deliveryFeeEnabled : true;
    const currentEnabled = req.body.deliveryFeeEnabled;

    const update = {
      deliveryFeeEnabled: req.body.deliveryFeeEnabled,
      deliveryFeeAmount: req.body.deliveryFeeAmount,
      freeDeliveryEnabled: req.body.freeDeliveryEnabled,
      freeDeliveryMinimum: req.body.freeDeliveryMinimum,
      promoNotifications: req.body.promoNotifications,
      notificationMessage: req.body.notificationMessage,
      updatedAt: Date.now(),
    };

    const settings = await AppSettings.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    // If delivery fee is disabled (meaning free delivery is active for everyone!)
    if (prevEnabled !== false && currentEnabled === false) {
      dispatchFreeDeliveryPromo();
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to save app settings',
      error: error.message,
    });
  }
};
