const express = require('express');
const router = express.Router();

// Import controllers
const {
  registerWithEmail,
  loginWithEmail,
  loginWithFirebase,
  loginAsGuest,
  adminLogin,
  refreshToken,
  logout
} = require('../controllers/authController');

// Import middleware
const { verifyToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateAdminLogin
} = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Register user with email
// @access  Public
router.post('/register', validateUserRegistration, registerWithEmail);

// @route   POST /api/auth/login
// @desc    Login user with email
// @access  Public
router.post('/login', validateUserLogin, loginWithEmail);

// @route   POST /api/auth/firebase
// @desc    Login with Firebase (Google/Facebook)
// @access  Public
router.post('/firebase', loginWithFirebase);

// @route   POST /api/auth/guest
// @desc    Login as guest
// @access  Public
router.post('/guest', loginAsGuest);

// @route   POST /api/auth/admin
// @desc    Admin login
// @access  Public
router.post('/admin', validateAdminLogin, adminLogin);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', verifyToken, logout);

module.exports = router;
