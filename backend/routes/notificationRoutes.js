const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification,
  deleteAllNotifications,
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

module.exports = router;
