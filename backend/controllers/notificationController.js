const Notification = require('../models/Notification');
const User = require('../models/User');

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
