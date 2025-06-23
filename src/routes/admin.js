const express = require('express');
const router = express.Router();

// Import controllers
const {
  getDashboard,
  getUsers,
  blockUser,
  unblockUser,
  verifyUser,
  grantLivePermission,
  getPosts,
  deletePost
} = require('../controllers/adminController');

// Import middleware
const { verifyAdmin } = require('../middleware/auth');
const { validatePagination, validateId } = require('../middleware/validation');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/dashboard', verifyAdmin, getDashboard);

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Admin
router.get('/users', verifyAdmin, validatePagination, getUsers);

// @route   PUT /api/admin/users/:id/block
// @desc    Block user
// @access  Admin
router.put('/users/:id/block', verifyAdmin, validateId, blockUser);

// @route   PUT /api/admin/users/:id/unblock
// @desc    Unblock user
// @access  Admin
router.put('/users/:id/unblock', verifyAdmin, validateId, unblockUser);

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify user
// @access  Admin
router.put('/users/:id/verify', verifyAdmin, validateId, verifyUser);

// @route   PUT /api/admin/users/:id/live-permission
// @desc    Grant/revoke live permission
// @access  Admin
router.put('/users/:id/live-permission', verifyAdmin, validateId, grantLivePermission);

// @route   GET /api/admin/posts
// @desc    Get all posts with pagination and filters
// @access  Admin
router.get('/posts', verifyAdmin, validatePagination, getPosts);

// @route   DELETE /api/admin/posts/:id
// @desc    Delete post
// @access  Admin
router.delete('/posts/:id', verifyAdmin, validateId, deletePost);

router.get('/reports', verifyAdmin, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get reports endpoint - to be implemented' });
});

router.put('/reports/:id/resolve', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Resolve report endpoint - to be implemented' });
});

router.get('/live-applications', verifyAdmin, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get live applications endpoint - to be implemented' });
});

router.put('/live-applications/:id/approve', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Approve live application endpoint - to be implemented' });
});

router.put('/live-applications/:id/reject', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Reject live application endpoint - to be implemented' });
});

router.get('/redeem-requests', verifyAdmin, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get redeem requests endpoint - to be implemented' });
});

router.put('/redeem-requests/:id/approve', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Approve redeem request endpoint - to be implemented' });
});

router.get('/verify-requests', verifyAdmin, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get verify requests endpoint - to be implemented' });
});

router.put('/verify-requests/:id/approve', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Approve verify request endpoint - to be implemented' });
});

router.get('/interests', verifyAdmin, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get interests endpoint - to be implemented' });
});

router.post('/interests', verifyAdmin, (req, res) => {
  res.json({ success: true, message: 'Create interest endpoint - to be implemented' });
});

router.put('/interests/:id', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Update interest endpoint - to be implemented' });
});

router.delete('/interests/:id', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Delete interest endpoint - to be implemented' });
});

router.get('/diamond-packs', verifyAdmin, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get diamond packs endpoint - to be implemented' });
});

router.post('/diamond-packs', verifyAdmin, (req, res) => {
  res.json({ success: true, message: 'Create diamond pack endpoint - to be implemented' });
});

router.put('/diamond-packs/:id', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Update diamond pack endpoint - to be implemented' });
});

router.delete('/diamond-packs/:id', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Delete diamond pack endpoint - to be implemented' });
});

router.get('/gift-types', verifyAdmin, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get gift types endpoint - to be implemented' });
});

router.post('/gift-types', verifyAdmin, (req, res) => {
  res.json({ success: true, message: 'Create gift type endpoint - to be implemented' });
});

router.put('/gift-types/:id', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Update gift type endpoint - to be implemented' });
});

router.delete('/gift-types/:id', verifyAdmin, validateId, (req, res) => {
  res.json({ success: true, message: 'Delete gift type endpoint - to be implemented' });
});

router.get('/app-settings', verifyAdmin, (req, res) => {
  res.json({ success: true, message: 'Get app settings endpoint - to be implemented' });
});

router.put('/app-settings', verifyAdmin, (req, res) => {
  res.json({ success: true, message: 'Update app settings endpoint - to be implemented' });
});

module.exports = router;
