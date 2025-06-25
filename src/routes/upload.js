const express = require('express');
const router = express.Router();

// Import AWS configuration
const { 
  profileImageUpload, 
  postMediaUpload, 
  storyMediaUpload, 
  documentUpload 
} = require('../config/aws');

// Import middleware
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/upload/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image', verifyToken, (req, res) => {
  // Check if AWS is properly configured
  if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'test') {
    // Mock response for development without real AWS
    return res.json({
      success: true,
      message: 'Profile image uploaded successfully (MOCK)',
      data: {
        url: 'https://via.placeholder.com/300x300.png?text=Profile+Image',
        key: 'profiles/mock-image.png'
      }
    });
  }

  profileImageUpload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    try {
      // Update user profile image in database
      const prisma = require('../config/database');
      await prisma.user.update({
        where: { id: req.user.id },
        data: { profileImage: req.file.location }
      });

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          url: req.file.location,
          key: req.file.key
        }
      });
    } catch (error) {
      console.error('Profile image upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile image'
      });
    }
  });
});

// @route   POST /api/upload/cover-image
// @desc    Upload cover image
// @access  Private
router.post('/cover-image', verifyToken, (req, res) => {
  profileImageUpload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    try {
      // Update user cover image in database
      const prisma = require('../config/database');
      await prisma.user.update({
        where: { id: req.user.id },
        data: { coverImage: req.file.location }
      });

      res.json({
        success: true,
        message: 'Cover image uploaded successfully',
        data: {
          url: req.file.location,
          key: req.file.key
        }
      });
    } catch (error) {
      console.error('Cover image upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update cover image'
      });
    }
  });
});

// @route   POST /api/upload/post-media
// @desc    Upload post media (image/video)
// @access  Private
router.post('/post-media', verifyToken, (req, res) => {
  postMediaUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.files || (!req.files.image && !req.files.video)) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const uploadedFiles = {};
    
    if (req.files.image) {
      uploadedFiles.image = {
        url: req.files.image[0].location,
        key: req.files.image[0].key
      };
    }
    
    if (req.files.video) {
      uploadedFiles.video = {
        url: req.files.video[0].location,
        key: req.files.video[0].key
      };
    }

    res.json({
      success: true,
      message: 'Media uploaded successfully',
      data: uploadedFiles
    });
  });
});

// @route   POST /api/upload/story-media
// @desc    Upload story media (image/video)
// @access  Private
router.post('/story-media', verifyToken, (req, res) => {
  storyMediaUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.files || (!req.files.image && !req.files.video)) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const uploadedFiles = {};
    
    if (req.files.image) {
      uploadedFiles.image = {
        url: req.files.image[0].location,
        key: req.files.image[0].key
      };
    }
    
    if (req.files.video) {
      uploadedFiles.video = {
        url: req.files.video[0].location,
        key: req.files.video[0].key
      };
    }

    res.json({
      success: true,
      message: 'Story media uploaded successfully',
      data: uploadedFiles
    });
  });
});

// @route   POST /api/upload/document
// @desc    Upload verification document
// @access  Private
router.post('/document', verifyToken, (req, res) => {
  documentUpload.single('document')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: req.file.location,
        key: req.file.key
      }
    });
  });
});

module.exports = router;
