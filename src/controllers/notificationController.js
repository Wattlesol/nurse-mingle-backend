const prisma = require('../config/database');
const { sendPushNotification } = require('../config/firebase');

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    const where = { userId };
    if (type) {
      where.type = type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.notification.count({ where });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true, isRead: true }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark this notification as read'
      });
    }

    if (notification.isRead) {
      return res.status(400).json({
        success: false,
        error: 'Notification already marked as read'
      });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this notification'
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
};

// Send push notification (utility function)
const sendNotification = async (userId, title, message, type, data = {}) => {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: JSON.stringify(data)
      }
    });

    // Get user's device token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deviceToken: true }
    });

    // Send push notification if device token exists
    if (user?.deviceToken) {
      const pushResult = await sendPushNotification(
        user.deviceToken,
        { title, body: message },
        { 
          type, 
          notificationId: notification.id,
          ...data 
        }
      );

      // Log push notification
      await prisma.pushNotification.create({
        data: {
          userId,
          title,
          message,
          data: JSON.stringify({ type, notificationId: notification.id, ...data }),
          status: pushResult.success ? 'sent' : 'failed'
        }
      });
    }

    return {
      success: true,
      notification
    };
  } catch (error) {
    console.error('Send notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send bulk notifications (admin function)
const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, title, message, type, data = {} } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    const results = await Promise.allSettled(
      userIds.map(userId => sendNotification(userId, title, message, type, data))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    res.json({
      success: true,
      message: `Bulk notification sent`,
      data: {
        total: results.length,
        successful,
        failed
      }
    });
  } catch (error) {
    console.error('Send bulk notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk notification'
    });
  }
};

// Update device token
const updateDeviceToken = async (req, res) => {
  try {
    const { deviceToken } = req.body;
    const userId = req.user.id;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        error: 'Device token is required'
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deviceToken }
    });

    res.json({
      success: true,
      message: 'Device token updated successfully'
    });
  } catch (error) {
    console.error('Update device token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device token'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendNotification,
  sendBulkNotification,
  updateDeviceToken
};
