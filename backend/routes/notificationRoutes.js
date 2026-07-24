const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  savePushSubscription,
  savePushSubscriptionPublic,
  sendPushNotification,
  sendPushNotificationPublic,
  registerFcmToken,
  sendTestNotification,
  sendAdminNotification,
  getMyPushSubscriptions,
  debugAllPushSubscriptions,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

// Public Web Push endpoints (for browser push testing & guest registration)
router.post('/public-subscribe', savePushSubscriptionPublic);
router.post('/public-trigger-test', sendPushNotificationPublic);

// Development-only: public debug route to list all push subscriptions
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug/all-subscriptions', debugAllPushSubscriptions);
}

// All remaining notification routes require authentication
router.use(authenticate);


// Get user's notifications
router.get('/', getNotifications);

// Create notification (admin only)
router.post('/create', createNotification);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Delete specific notification
router.delete('/:notificationId', deleteNotification);

// Delete all notifications
router.delete('/', deleteAllNotifications);

// Browser push subscription management
router.post('/push/subscribe', savePushSubscription);
router.post('/push/send', sendPushNotification);

// FCM token management
router.post('/fcm/register', registerFcmToken);

// Test notification (for local development and verification)
router.post('/test', sendTestNotification);

// Debug: get current user's push subscriptions
router.get('/push/subscriptions', getMyPushSubscriptions);

// Development-only: list all push subscriptions
router.get('/debug/all-subscriptions', debugAllPushSubscriptions);

// Admin broadcast notification
router.post('/admin/broadcast', sendAdminNotification);

module.exports = router;
