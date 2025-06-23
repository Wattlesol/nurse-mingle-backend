const prisma = require('../config/database');
const { deleteFileFromS3 } = require('../config/aws');

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        profileImage: true,
        coverImage: true,
        bio: true,
        age: true,
        gender: true,
        location: true,
        isVerified: true,
        diamonds: true,
        coins: true,
        loginType: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { username, fullName, bio, age, gender, location } = req.body;
    const userId = req.user.id;

    // Check if username is already taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken'
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(fullName && { fullName }),
        ...(bio !== undefined && { bio }),
        ...(age && { age }),
        ...(gender && { gender }),
        ...(location && { location })
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        profileImage: true,
        coverImage: true,
        bio: true,
        age: true,
        gender: true,
        location: true,
        isVerified: true,
        diamonds: true,
        coins: true,
        loginType: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        profileImage: true,
        coverImage: true,
        bio: true,
        age: true,
        gender: true,
        location: true,
        isVerified: true,
        isOnline: true,
        lastActive: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: id
          }
        }
      });
      isFollowing = !!follow;
    }

    res.json({
      success: true,
      data: {
        ...user,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } }
        ],
        isBlocked: false
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        profileImage: true,
        isVerified: true,
        isOnline: true,
        _count: {
          select: {
            followers: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: {
        followers: {
          _count: 'desc'
        }
      }
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } }
        ],
        isBlocked: false
      }
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
};

// Follow user
const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;

    if (followerId === id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot follow yourself'
      });
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true }
    });

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: id
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: 'Already following this user'
      });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId: id
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: id,
        title: 'New Follower',
        message: `${req.user.fullName || req.user.username} started following you`,
        type: 'follow',
        data: JSON.stringify({ followerId })
      }
    });

    res.json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow user'
    });
  }
};

// Unfollow user
const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: id
        }
      }
    });

    if (!follow) {
      return res.status(400).json({
        success: false,
        error: 'Not following this user'
      });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: id
        }
      }
    });

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user'
    });
  }
};

// Get user followers
const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const followers = await prisma.follow.findMany({
      where: { followingId: id },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
            isVerified: true,
            isOnline: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.follow.count({
      where: { followingId: id }
    });

    res.json({
      success: true,
      data: {
        followers: followers.map(f => f.follower),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get followers'
    });
  }
};

// Get user following
const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const following = await prisma.follow.findMany({
      where: { followerId: id },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
            isVerified: true,
            isOnline: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.follow.count({
      where: { followerId: id }
    });

    res.json({
      success: true,
      data: {
        following: following.map(f => f.following),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get following'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
};
