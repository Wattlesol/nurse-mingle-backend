const express = require('express');
const router = express.Router();

// Import middleware
const { verifyToken, canGoLive } = require('../middleware/auth');
const { validatePagination, validateId } = require('../middleware/validation');

// Import Agora service
const agoraService = require('../services/agoraService');

// @route   POST /api/live/token
// @desc    Generate Agora token for live streaming
// @access  Private
router.post('/token', verifyToken, canGoLive, async (req, res) => {
  try {
    const { channelName, isHost = true } = req.body;
    
    if (!channelName) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required'
      });
    }

    const result = await agoraService.generateLiveStreamToken(
      req.user.id,
      channelName,
      isHost
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Generate live token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate live token'
    });
  }
});

// @route   POST /api/live/call-token
// @desc    Generate Agora token for voice/video calls
// @access  Private
router.post('/call-token', verifyToken, async (req, res) => {
  try {
    const { receiverId, callType = 'video' } = req.body;
    
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID is required'
      });
    }

    const result = await agoraService.generateCallToken(
      req.user.id,
      receiverId,
      callType
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Generate call token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate call token'
    });
  }
});

// @route   GET /api/live/call-history
// @desc    Get call history
// @access  Private
router.get('/call-history', verifyToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await agoraService.getCallHistory(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get call history'
    });
  }
});

// Placeholder routes for other live streaming features
router.get('/rooms', verifyToken, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get live rooms endpoint - to be implemented' });
});

router.post('/rooms', verifyToken, canGoLive, (req, res) => {
  res.json({ success: true, message: 'Create live room endpoint - to be implemented' });
});

router.get('/rooms/:id', verifyToken, validateId, (req, res) => {
  res.json({ success: true, message: 'Get live room endpoint - to be implemented' });
});

router.post('/rooms/:id/join', verifyToken, validateId, (req, res) => {
  res.json({ success: true, message: 'Join live room endpoint - to be implemented' });
});

router.post('/rooms/:id/leave', verifyToken, validateId, (req, res) => {
  res.json({ success: true, message: 'Leave live room endpoint - to be implemented' });
});

router.post('/application', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Apply for live streaming endpoint - to be implemented' });
});

router.get('/history', verifyToken, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get live history endpoint - to be implemented' });
});

module.exports = router;
