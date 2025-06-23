const jwt = require('jsonwebtoken');
const { verifyFirebaseToken } = require('../config/firebase');
const prisma = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        profileImage: true,
        isBlocked: true,
        isVerified: true,
        loginType: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Account is blocked'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Verify Firebase token
const verifyFirebaseAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const result = await verifyFirebaseToken(token);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Firebase token'
      });
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { firebaseUid: result.user.uid }
    });

    if (!user) {
      // Create new user from Firebase data
      user = await prisma.user.create({
        data: {
          firebaseUid: result.user.uid,
          email: result.user.email,
          fullName: result.user.name,
          profileImage: result.user.picture,
          loginType: 'firebase',
          isVerified: result.user.email_verified || false
        }
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Account is blocked'
      });
    }

    req.user = user;
    req.firebaseUser = result.user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Firebase authentication failed'
    });
  }
};

// Optional authentication (for guest access)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        profileImage: true,
        isBlocked: true,
        isVerified: true,
        loginType: true,
        createdAt: true
      }
    });

    if (user && !user.isBlocked) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Admin authentication
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        username: true,
        userType: true,
        createdAt: true
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin not found'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin token'
    });
  }
};

// Check if user can go live
const canGoLive = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { canGoLive: true }
    });

    if (!user?.canGoLive) {
      return res.status(403).json({
        success: false,
        error: 'Live streaming permission required'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  verifyToken,
  verifyFirebaseAuth,
  optionalAuth,
  verifyAdmin,
  canGoLive
};
