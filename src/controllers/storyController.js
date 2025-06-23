const prisma = require('../config/database');
const { deleteFileFromS3 } = require('../config/aws');

// Create a new story
const createStory = async (req, res) => {
  try {
    const { image, video } = req.body;
    const userId = req.user.id;

    if (!image && !video) {
      return res.status(400).json({
        success: false,
        error: 'Story must have an image or video'
      });
    }

    // Set expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await prisma.story.create({
      data: {
        userId,
        image,
        video,
        expiresAt
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
            isVerified: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: story
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create story'
    });
  }
};

// Get stories feed
const getStoriesFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user?.id;

    // Get stories that haven't expired
    const stories = await prisma.story.findMany({
      where: {
        status: true,
        expiresAt: {
          gt: new Date()
        },
        user: {
          isBlocked: false
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
            isVerified: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    // Group stories by user
    const groupedStories = {};
    stories.forEach(story => {
      const userId = story.user.id;
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: story.user,
          stories: []
        };
      }
      groupedStories[userId].stories.push({
        id: story.id,
        image: story.image,
        video: story.video,
        views: story.views,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt
      });
    });

    const formattedStories = Object.values(groupedStories);

    res.json({
      success: true,
      data: {
        stories: formattedStories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedStories.length
        }
      }
    });
  } catch (error) {
    console.error('Get stories feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stories feed'
    });
  }
};

// Get story by ID
const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
            isVerified: true
          }
        }
      }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    if (!story.status || story.expiresAt < new Date()) {
      return res.status(404).json({
        success: false,
        error: 'Story not available'
      });
    }

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get story'
    });
  }
};

// Get user stories
const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const stories = await prisma.story.findMany({
      where: {
        userId,
        status: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
            isVerified: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        user: stories[0]?.user || null,
        stories: stories.map(story => ({
          id: story.id,
          image: story.image,
          video: story.video,
          views: story.views,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt
        }))
      }
    });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stories'
    });
  }
};

// View story (increment view count)
const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const story = await prisma.story.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, expiresAt: true }
    });

    if (!story || !story.status || story.expiresAt < new Date()) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Don't count views from the story owner
    if (story.userId !== userId) {
      await prisma.story.update({
        where: { id },
        data: {
          views: {
            increment: 1
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Story viewed successfully'
    });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to view story'
    });
  }
};

// Delete story
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const story = await prisma.story.findUnique({
      where: { id },
      select: { userId: true, image: true, video: true }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    if (story.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this story'
      });
    }

    // Soft delete the story
    await prisma.story.update({
      where: { id },
      data: { status: false }
    });

    // Optionally delete media files from S3
    if (story.image) {
      await deleteFileFromS3(story.image);
    }
    if (story.video) {
      await deleteFileFromS3(story.video);
    }

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete story'
    });
  }
};

// Clean up expired stories (utility function)
const cleanupExpiredStories = async () => {
  try {
    const expiredStories = await prisma.story.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        status: true
      },
      select: { id: true, image: true, video: true }
    });

    // Soft delete expired stories
    await prisma.story.updateMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        status: true
      },
      data: { status: false }
    });

    // Optionally delete media files from S3
    for (const story of expiredStories) {
      if (story.image) {
        await deleteFileFromS3(story.image);
      }
      if (story.video) {
        await deleteFileFromS3(story.video);
      }
    }

    console.log(`Cleaned up ${expiredStories.length} expired stories`);
    return expiredStories.length;
  } catch (error) {
    console.error('Cleanup expired stories error:', error);
    return 0;
  }
};

// Schedule cleanup every hour
setInterval(cleanupExpiredStories, 60 * 60 * 1000);

module.exports = {
  createStory,
  getStoriesFeed,
  getStoryById,
  getUserStories,
  viewStory,
  deleteStory,
  cleanupExpiredStories
};
