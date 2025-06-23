const express = require('express');
const router = express.Router();

// Import controllers
const {
  getConversations,
  getConversationMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount
} = require('../controllers/messageController');

// Import middleware
const { verifyToken } = require('../middleware/auth');
const {
  validatePagination,
  validateId,
  validateMessage
} = require('../middleware/validation');

// @route   GET /api/messages/conversations
// @desc    Get user conversations
// @access  Private
router.get('/conversations', verifyToken, validatePagination, getConversations);

// @route   GET /api/messages/conversations/:userId
// @desc    Get conversation messages with specific user
// @access  Private
router.get('/conversations/:userId', verifyToken, validateId, validatePagination, getConversationMessages);

// @route   POST /api/messages/send
// @desc    Send message (HTTP endpoint - Socket.IO preferred for real-time)
// @access  Private
router.post('/send', verifyToken, validateMessage, sendMessage);

// @route   GET /api/messages/unread-count
// @desc    Get unread messages count
// @access  Private
router.get('/unread-count', verifyToken, getUnreadCount);

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', verifyToken, validateId, markMessageAsRead);

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private
router.delete('/:id', verifyToken, validateId, deleteMessage);

module.exports = router;
