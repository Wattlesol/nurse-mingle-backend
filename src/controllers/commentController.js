const prisma = require('../config/database');

// Get comments for a post
const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true }
    });

    if (!post || !post.status) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
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

    const total = await prisma.comment.count({
      where: { postId }
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comments'
    });
  }
};

// Add comment to post
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, status: true }
    });

    if (!post || !post.status) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Create comment and update post comments count
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          userId,
          content
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
      }),
      prisma.post.update({
        where: { id: postId },
        data: {
          comments: {
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
          title: 'New Comment',
          message: `${req.user.fullName || req.user.username} commented on your post`,
          type: 'comment',
          data: JSON.stringify({ 
            postId, 
            commentId: comment.id, 
            commenterId: userId 
          })
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this comment'
      });
    }

    const updatedComment = await prisma.comment.update({
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
        }
      }
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true, postId: true }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    // Delete comment and update post comments count
    await prisma.$transaction([
      prisma.comment.delete({
        where: { id }
      }),
      prisma.post.update({
        where: { id: comment.postId },
        data: {
          comments: {
            decrement: 1
          }
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
};

module.exports = {
  getPostComments,
  addComment,
  updateComment,
  deleteComment
};
