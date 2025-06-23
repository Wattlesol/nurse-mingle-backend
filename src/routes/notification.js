const express = require('express');
const router = express.Router();

// Import controllers
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendBulkNotification,
  updateDeviceToken
} = require('../controllers/notificationController');

// Import middleware
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { validatePagination, validateId } = require('../middleware/validation');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', verifyToken, validatePagination, getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', verifyToken, getUnreadCount);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', verifyToken, validateId, markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', verifyToken, markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', verifyToken, validateId, deleteNotification);

// @route   POST /api/notifications/device-token
// @desc    Update device token for push notifications
// @access  Private
router.post('/device-token', verifyToken, updateDeviceToken);

// @route   POST /api/notifications/bulk
// @desc    Send bulk notification (admin only)
// @access  Admin
router.post('/bulk', verifyAdmin, sendBulkNotification);

module.exports = router;
