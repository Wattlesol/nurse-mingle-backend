const express = require('express');
const router = express.Router();

// Import controllers
const {
  getProfile,
  updateProfile,
  getUserById,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} = require('../controllers/userController');

// Import middleware
const { verifyToken, optionalAuth } = require('../middleware/auth');
const {
  validateProfileUpdate,
  validatePagination,
  validateId
} = require('../middleware/validation');

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', verifyToken, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyToken, validateProfileUpdate, updateProfile);

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', optionalAuth, validatePagination, searchUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', optionalAuth, validateId, getUserById);

// @route   POST /api/users/:id/follow
// @desc    Follow user
// @access  Private
router.post('/:id/follow', verifyToken, validateId, followUser);

// @route   DELETE /api/users/:id/follow
// @desc    Unfollow user
// @access  Private
router.delete('/:id/follow', verifyToken, validateId, unfollowUser);

// @route   GET /api/users/:id/followers
// @desc    Get user followers
// @access  Public
router.get('/:id/followers', optionalAuth, validateId, validatePagination, getFollowers);

// @route   GET /api/users/:id/following
// @desc    Get user following
// @access  Public
router.get('/:id/following', optionalAuth, validateId, validatePagination, getFollowing);

module.exports = router;
