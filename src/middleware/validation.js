const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// Admin login validation
const validateAdminLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Post creation validation
const validatePostCreation = [
  body('content')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Content must not exceed 2000 characters'),
  body('content')
    .custom((value, { req }) => {
      if (!value && !req.files?.image && !req.files?.video) {
        throw new Error('Post must have content, image, or video');
      }
      return true;
    }),
  handleValidationErrors
];

// Story creation validation
const validateStoryCreation = [
  body('content')
    .custom((value, { req }) => {
      if (!req.files?.image && !req.files?.video) {
        throw new Error('Story must have an image or video');
      }
      return true;
    }),
  handleValidationErrors
];

// Comment creation validation
const validateCommentCreation = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters'),
  param('postId')
    .notEmpty()
    .withMessage('Post ID is required'),
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required'),
  body('content')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message content must not exceed 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'video', 'gift'])
    .withMessage('Invalid message type'),
  handleValidationErrors
];

// Live room validation
const validateLiveRoom = [
  body('title')
    .notEmpty()
    .withMessage('Live room title is required')
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

// Report validation
const validateReport = [
  body('reason')
    .notEmpty()
    .withMessage('Report reason is required')
    .isIn(['spam', 'harassment', 'inappropriate_content', 'fake_account', 'other'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

// Redeem request validation
const validateRedeemRequest = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['paypal', 'bank_transfer', 'crypto'])
    .withMessage('Invalid payment method'),
  body('paymentDetails')
    .notEmpty()
    .withMessage('Payment details are required'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: parseInt(process.env.MAX_PAGE_SIZE) || 100 })
    .withMessage(`Limit must be between 1 and ${process.env.MAX_PAGE_SIZE || 100}`),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .notEmpty()
    .withMessage('ID is required'),
  handleValidationErrors
];

// User profile update validation
const validateProfileUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  handleValidationErrors
];

// Interest validation
const validateInterest = [
  body('name')
    .notEmpty()
    .withMessage('Interest name is required')
    .isLength({ max: 50 })
    .withMessage('Interest name must not exceed 50 characters'),
  handleValidationErrors
];

// Gift validation
const validateGift = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required'),
  body('giftType')
    .notEmpty()
    .withMessage('Gift type is required'),
  body('giftName')
    .notEmpty()
    .withMessage('Gift name is required'),
  body('price')
    .isInt({ min: 1 })
    .withMessage('Gift price must be at least 1 diamond'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateAdminLogin,
  validatePostCreation,
  validateStoryCreation,
  validateCommentCreation,
  validateMessage,
  validateLiveRoom,
  validateReport,
  validateRedeemRequest,
  validatePagination,
  validateId,
  validateProfileUpdate,
  validateInterest,
  validateGift
};
