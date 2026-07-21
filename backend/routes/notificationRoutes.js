const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification,
  deleteAllNotifications,
  savePushSubscription,
  sendPushNotification,
  registerFcmToken,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(authenticate);

// Get user's notifications
router.get('/', getNotifications);

// Create notification (admin only)
router.post('/create', createNotification);

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

module.exports = router;
