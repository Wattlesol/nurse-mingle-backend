const prisma = require('../config/database');
const { deleteFileFromS3 } = require('../config/aws');

// Create a new post
const createPost = async (req, res) => {
  try {
    const { content, image, video } = req.body;
    const userId = req.user.id;

    if (!content && !image && !video) {
      return res.status(400).json({
        success: false,
        error: 'Post must have content, image, or video'
      });
    }

    const post = await prisma.post.create({
      data: {
        userId,
        content,
        image,
        video
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
        },
        _count: {
          select: {
            postLikes: true,
            postComments: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        ...post,
        likes: post._count.postLikes,
        comments: post._count.postComments,
        isLiked: false
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
};

// Get posts feed
const getPostsFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user?.id;

    const posts = await prisma.post.findMany({
      where: {
        status: true,
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
        },
        _count: {
          select: {
            postLikes: true,
            postComments: true
          }
        },
        ...(userId && {
          postLikes: {
            where: { userId },
            select: { id: true }
          }
        })
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.post.count({
      where: {
        status: true,
        user: {
          isBlocked: false
        }
      }
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      likes: post._count.postLikes,
      comments: post._count.postComments,
      isLiked: userId ? post.postLikes.length > 0 : false,
      _count: undefined,
      postLikes: undefined
    }));

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get posts feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get posts feed'
    });
  }
};

// Get post by ID
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await prisma.post.findUnique({
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
        },
        _count: {
          select: {
            postLikes: true,
            postComments: true
          }
        },
        ...(userId && {
          postLikes: {
            where: { userId },
            select: { id: true }
          }
        })
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (!post.status) {
      return res.status(404).json({
        success: false,
        error: 'Post not available'
      });
    }

    const formattedPost = {
      ...post,
      likes: post._count.postLikes,
      comments: post._count.postComments,
      isLiked: userId ? post.postLikes?.length > 0 : false,
      _count: undefined,
      postLikes: undefined
    };

    res.json({
      success: true,
      data: formattedPost
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post'
    });
  }
};

// Get user posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?.id;

    const posts = await prisma.post.findMany({
      where: {
        userId,
        status: true
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
        },
        _count: {
          select: {
            postLikes: true,
            postComments: true
          }
        },
        ...(currentUserId && {
          postLikes: {
            where: { userId: currentUserId },
            select: { id: true }
          }
        })
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.post.count({
      where: {
        userId,
        status: true
      }
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      likes: post._count.postLikes,
      comments: post._count.postComments,
      isLiked: currentUserId ? post.postLikes?.length > 0 : false,
      _count: undefined,
      postLikes: undefined
    }));

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user posts'
    });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true, status: true }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (post.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post'
      });
    }

    if (!post.status) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update deleted post'
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { content },
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
            postComments: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        ...updatedPost,
        likes: updatedPost._count.postLikes,
        comments: updatedPost._count.postComments
      }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true, image: true, video: true }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    if (post.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    // Soft delete the post
    await prisma.post.update({
      where: { id },
      data: { status: false }
    });

    // Optionally delete media files from S3
    if (post.image) {
      await deleteFileFromS3(post.image);
    }
    if (post.video) {
      await deleteFileFromS3(post.video);
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
};

// Like post
const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true }
    });

    if (!post || !post.status) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId
        }
      }
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        error: 'Post already liked'
      });
    }

    // Create like and update post likes count
    await prisma.$transaction([
      prisma.like.create({
        data: {
          postId: id,
          userId
        }
      }),
      prisma.post.update({
        where: { id },
        data: {
          likes: {
            increment: 1
          }
        }
      })
    ]);

    // Create notification for post owner
    if (post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          title: 'New Like',
          message: `${req.user.fullName || req.user.username} liked your post`,
          type: 'like',
          data: JSON.stringify({ postId: id, likerId: userId })
        }
      });
    }

    res.json({
      success: true,
      message: 'Post liked successfully'
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like post'
    });
  }
};

// Unlike post
const unlikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId
        }
      }
    });

    if (!like) {
      return res.status(400).json({
        success: false,
        error: 'Post not liked'
      });
    }

    // Remove like and update post likes count
    await prisma.$transaction([
      prisma.like.delete({
        where: {
          postId_userId: {
            postId: id,
            userId
          }
        }
      }),
      prisma.post.update({
        where: { id },
        data: {
          likes: {
            decrement: 1
          }
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Post unliked successfully'
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlike post'
    });
  }
};

module.exports = {
  createPost,
  getPostsFeed,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost
};
