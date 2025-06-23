const express = require('express');
const router = express.Router();

// Import controllers
const {
  createStory,
  getStoriesFeed,
  getStoryById,
  getUserStories,
  viewStory,
  deleteStory
} = require('../controllers/storyController');

// Import middleware
const { verifyToken, optionalAuth } = require('../middleware/auth');
const {
  validatePagination,
  validateId,
  validateStoryCreation
} = require('../middleware/validation');

// @route   GET /api/stories
// @desc    Get stories feed
// @access  Public
router.get('/', optionalAuth, validatePagination, getStoriesFeed);

// @route   POST /api/stories
// @desc    Create a new story
// @access  Private
router.post('/', verifyToken, validateStoryCreation, createStory);

// @route   GET /api/stories/user/:userId
// @desc    Get user stories
// @access  Public
router.get('/user/:userId', optionalAuth, validateId, getUserStories);

// @route   GET /api/stories/:id
// @desc    Get story by ID
// @access  Public
router.get('/:id', optionalAuth, validateId, getStoryById);

// @route   POST /api/stories/:id/view
// @desc    View story (increment view count)
// @access  Private
router.post('/:id/view', verifyToken, validateId, viewStory);

// @route   DELETE /api/stories/:id
// @desc    Delete story
// @access  Private
router.delete('/:id', verifyToken, validateId, deleteStory);

module.exports = router;
