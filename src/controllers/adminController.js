const prisma = require('../config/database');

// Get admin dashboard stats
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalStories,
      totalMessages,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      liveApplications,
      pendingReports,
      pendingRedeemRequests,
      pendingVerifyRequests
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count({ where: { status: true } }),
      prisma.story.count({ where: { status: true } }),
      prisma.message.count(),
      prisma.user.count({ where: { isOnline: true } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.liveApplication.count(),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.redeemRequest.count({ where: { status: 'pending' } }),
      prisma.verifyRequest.count({ where: { status: 'pending' } })
    ]);

    // Get recent activity
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        profileImage: true,
        createdAt: true,
        loginType: true
      }
    });

    const recentPosts = await prisma.post.findMany({
      take: 5,
      where: { status: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPosts,
          totalStories,
          totalMessages,
          activeUsers,
          blockedUsers,
          verifiedUsers,
          liveApplications,
          pendingReports,
          pendingRedeemRequests,
          pendingVerifyRequests
        },
        recentActivity: {
          recentUsers,
          recentPosts
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data'
    });
  }
};

// Get all users with pagination and filters
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      verified, 
      loginType 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status === 'blocked') {
      where.isBlocked = true;
    } else if (status === 'active') {
      where.isBlocked = false;
    }
    
    if (verified === 'true') {
      where.isVerified = true;
    } else if (verified === 'false') {
      where.isVerified = false;
    }
    
    if (loginType) {
      where.loginType = loginType;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        profileImage: true,
        isBlocked: true,
        isVerified: true,
        canGoLive: true,
        loginType: true,
        diamonds: true,
        coins: true,
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
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isBlocked: true, username: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isBlocked) {
      return res.status(400).json({
        success: false,
        error: 'User is already blocked'
      });
    }

    await prisma.user.update({
      where: { id },
      data: { 
        isBlocked: true,
        isOnline: false
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: id,
        title: 'Account Blocked',
        message: reason || 'Your account has been blocked by admin',
        type: 'admin',
        data: JSON.stringify({ action: 'block', reason })
      }
    });

    res.json({
      success: true,
      message: `User ${user.username} blocked successfully`
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block user'
    });
  }
};

// Unblock user
const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isBlocked: true, username: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isBlocked) {
      return res.status(400).json({
        success: false,
        error: 'User is not blocked'
      });
    }

    await prisma.user.update({
      where: { id },
      data: { isBlocked: false }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: id,
        title: 'Account Unblocked',
        message: 'Your account has been unblocked by admin',
        type: 'admin',
        data: JSON.stringify({ action: 'unblock' })
      }
    });

    res.json({
      success: true,
      message: `User ${user.username} unblocked successfully`
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unblock user'
    });
  }
};

// Verify user
const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isVerified: true, username: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'User is already verified'
      });
    }

    await prisma.user.update({
      where: { id },
      data: { isVerified: true }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: id,
        title: 'Account Verified',
        message: 'Congratulations! Your account has been verified',
        type: 'admin',
        data: JSON.stringify({ action: 'verify' })
      }
    });

    res.json({
      success: true,
      message: `User ${user.username} verified successfully`
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify user'
    });
  }
};

// Grant live permission
const grantLivePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { canGoLive } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, canGoLive: true, username: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await prisma.user.update({
      where: { id },
      data: { canGoLive: Boolean(canGoLive) }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: id,
        title: canGoLive ? 'Live Permission Granted' : 'Live Permission Revoked',
        message: canGoLive 
          ? 'You can now go live!' 
          : 'Your live streaming permission has been revoked',
        type: 'admin',
        data: JSON.stringify({ action: 'live_permission', canGoLive })
      }
    });

    res.json({
      success: true,
      message: `Live permission ${canGoLive ? 'granted to' : 'revoked from'} ${user.username}`
    });
  } catch (error) {
    console.error('Grant live permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update live permission'
    });
  }
};

// Get all posts with pagination and filters
const getPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status 
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (status === 'active') {
      where.status = true;
    } else if (status === 'deleted') {
      where.status = false;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            postLikes: true,
            postComments: true,
            reports: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.post.count({ where });

    res.json({
      success: true,
      data: {
        posts: posts.map(post => ({
          ...post,
          likes: post._count.postLikes,
          comments: post._count.postComments,
          reports: post._count.reports
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get posts'
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { 
        id: true, 
        status: true, 
        userId: true,
        user: { select: { username: true } }
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (!post.status) {
      return res.status(400).json({
        success: false,
        error: 'Post is already deleted'
      });
    }

    await prisma.post.update({
      where: { id },
      data: { status: false }
    });

    // Create notification for post owner
    await prisma.notification.create({
      data: {
        userId: post.userId,
        title: 'Post Removed',
        message: reason || 'Your post has been removed by admin',
        type: 'admin',
        data: JSON.stringify({ action: 'delete_post', postId: id, reason })
      }
    });

    res.json({
      success: true,
      message: `Post by ${post.user.username} deleted successfully`
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  blockUser,
  unblockUser,
  verifyUser,
  grantLivePermission,
  getPosts,
  deletePost
};
