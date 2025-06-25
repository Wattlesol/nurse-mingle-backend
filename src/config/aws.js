const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS
console.log('AWS Configuration:', {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET
});

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const allowedVideoTypes = process.env.ALLOWED_VIDEO_TYPES?.split(',') || ['mp4', 'mov', 'avi', 'mkv'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (file.mimetype.startsWith('image/') && allowedImageTypes.includes(fileExtension)) {
    cb(null, true);
  } else if (file.mimetype.startsWith('video/') && allowedVideoTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

// Generate unique filename
const generateFileName = (originalname) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalname);
  return `${timestamp}-${randomString}${extension}`;
};

// Multer S3 configuration for profile images
const profileImageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: function (req, file, cb) {
      const fileName = generateFileName(file.originalname);
      cb(null, `profiles/${fileName}`);
    },
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
});

// Multer S3 configuration for post media
const postMediaUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: function (req, file, cb) {
      const fileName = generateFileName(file.originalname);
      const folder = file.mimetype.startsWith('image/') ? 'posts/images' : 'posts/videos';
      cb(null, `${folder}/${fileName}`);
    },
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  },
});

// Multer S3 configuration for story media
const storyMediaUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    key: function (req, file, cb) {
      const fileName = generateFileName(file.originalname);
      const folder = file.mimetype.startsWith('image/') ? 'stories/images' : 'stories/videos';
      cb(null, `${folder}/${fileName}`);
    },
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  },
});

// Multer S3 configuration for verification documents
const documentUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private', // Documents should be private
    key: function (req, file, cb) {
      const fileName = generateFileName(file.originalname);
      cb(null, `documents/${fileName}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Only allow images for documents
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for documents.'), false);
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  },
});

// Delete file from S3
const deleteFileFromS3 = async (fileUrl) => {
  try {
    const key = fileUrl.replace(`${process.env.AWS_S3_URL}/`, '');
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return { success: false, error: error.message };
  }
};

// Get signed URL for private files
const getSignedUrl = (fileKey, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Expires: expiresIn,
    };

    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

module.exports = {
  s3,
  profileImageUpload,
  postMediaUpload,
  storyMediaUpload,
  documentUpload,
  deleteFileFromS3,
  getSignedUrl,
};
