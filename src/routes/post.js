const express = require('express');
const router = express.Router();

// Import controllers
const {
  createPost,
  getPostsFeed,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost
} = require('../controllers/postController');

const {
  getPostComments,
  addComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');

// Import middleware
const { verifyToken, optionalAuth } = require('../middleware/auth');
const {
  validatePagination,
  validateId,
  validatePostCreation,
  validateCommentCreation
} = require('../middleware/validation');

// @route   GET /api/posts
// @desc    Get posts feed
// @access  Public
router.get('/', optionalAuth, validatePagination, getPostsFeed);

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', verifyToken, validatePostCreation, createPost);

// @route   GET /api/posts/user/:userId
// @desc    Get user posts
// @access  Public
router.get('/user/:userId', optionalAuth, validateId, validatePagination, getUserPosts);

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', optionalAuth, validateId, getPostById);

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put('/:id', verifyToken, validateId, updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', verifyToken, validateId, deletePost);

// @route   POST /api/posts/:id/like
// @desc    Like post
// @access  Private
router.post('/:id/like', verifyToken, validateId, likePost);

// @route   DELETE /api/posts/:id/like
// @desc    Unlike post
// @access  Private
router.delete('/:id/like', verifyToken, validateId, unlikePost);

// @route   GET /api/posts/:postId/comments
// @desc    Get post comments
// @access  Public
router.get('/:postId/comments', optionalAuth, validatePagination, getPostComments);

// @route   POST /api/posts/:postId/comments
// @desc    Add comment to post
// @access  Private
router.post('/:postId/comments', verifyToken, validateCommentCreation, addComment);

// @route   PUT /api/posts/comments/:id
// @desc    Update comment
// @access  Private
router.put('/comments/:id', verifyToken, validateId, updateComment);

// @route   DELETE /api/posts/comments/:id
// @desc    Delete comment
// @access  Private
router.delete('/comments/:id', verifyToken, validateId, deleteComment);

module.exports = router;
