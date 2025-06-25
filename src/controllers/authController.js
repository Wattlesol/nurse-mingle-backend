const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyFirebaseToken } = require('../config/firebase');
const prisma = require('../config/database');

// Generate JWT token
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { 
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN 
  });
};

// Register with email
const registerWithEmail = async (req, res) => {
  try {
    const { email, password, username, fullName, age, gender, location } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        fullName,
        age,
        gender,
        location,
        loginType: 'email'
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        profileImage: true,
        isVerified: true,
        loginType: true,
        createdAt: true
      }
    });

    // Generate tokens
    const token = generateToken({ userId: user.id, type: 'user' });
    const refreshToken = generateRefreshToken({ userId: user.id, type: 'user' });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

// Login with email
const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
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
        error: 'Invalid email or password'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Account is blocked'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActive: new Date(),
        isOnline: true
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate tokens
    const token = generateToken({ userId: user.id, type: 'user' });
    const refreshToken = generateRefreshToken({ userId: user.id, type: 'user' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Login with Firebase (Google/Facebook)
const loginWithFirebase = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Firebase ID token is required'
      });
    }

    // Verify Firebase token
    const result = await verifyFirebaseToken(idToken);
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Firebase token'
      });
    }

    const firebaseUser = result.user;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
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
      // Create new user
      user = await prisma.user.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: firebaseUser.name,
          profileImage: firebaseUser.picture,
          loginType: firebaseUser.firebase?.sign_in_provider || 'firebase',
          isVerified: firebaseUser.email_verified || false
        },
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
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Account is blocked'
      });
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActive: new Date(),
        isOnline: true
      }
    });

    // Generate tokens
    const token = generateToken({ userId: user.id, type: 'user' });
    const refreshToken = generateRefreshToken({ userId: user.id, type: 'user' });

    res.json({
      success: true,
      message: 'Firebase login successful',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({
      success: false,
      error: 'Firebase login failed'
    });
  }
};

// Guest login
const loginAsGuest = async (req, res) => {
  try {
    const { deviceId } = req.body;

    // Create guest user
    const user = await prisma.user.create({
      data: {
        username: `guest_${Date.now()}`,
        fullName: 'Guest User',
        loginType: 'guest',
        deviceToken: deviceId
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        profileImage: true,
        isVerified: true,
        loginType: true,
        createdAt: true
      }
    });

    // Generate tokens
    const token = generateToken({ userId: user.id, type: 'user' });
    const refreshToken = generateRefreshToken({ userId: user.id, type: 'user' });

    res.status(201).json({
      success: true,
      message: 'Guest login successful',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({
      success: false,
      error: 'Guest login failed'
    });
  }
};

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin
    const admin = await prisma.adminUser.findUnique({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate admin token
    const token = generateToken({ adminId: admin.id, type: 'admin' });

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          userType: admin.userType
        },
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin login failed'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Generate new tokens
    const newToken = generateToken({ userId: decoded.userId, type: decoded.type });
    const newRefreshToken = generateRefreshToken({ userId: decoded.userId, type: decoded.type });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Update user online status
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { isOnline: false }
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

module.exports = {
  registerWithEmail,
  loginWithEmail,
  loginWithFirebase,
  loginAsGuest,
  adminLogin,
  refreshToken,
  logout
};
