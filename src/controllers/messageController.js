const prisma = require('../config/database');

// Get user conversations
const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Get latest message for each conversation
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT ON (
        CASE 
          WHEN sender_id = ${userId} THEN receiver_id 
          ELSE sender_id 
        END
      )
      m.*,
      u.id as other_user_id,
      u.username as other_user_username,
      u.full_name as other_user_full_name,
      u.profile_image as other_user_profile_image,
      u.is_verified as other_user_is_verified,
      u.is_online as other_user_is_online,
      u.last_active as other_user_last_active,
      (
        SELECT COUNT(*)::int 
        FROM messages m2 
        WHERE m2.receiver_id = ${userId} 
        AND m2.sender_id = (
          CASE 
            WHEN m.sender_id = ${userId} THEN m.receiver_id 
            ELSE m.sender_id 
          END
        )
        AND m2.is_read = false
      ) as unread_count
      FROM messages m
      JOIN users u ON u.id = (
        CASE 
          WHEN m.sender_id = ${userId} THEN m.receiver_id 
          ELSE m.sender_id 
        END
      )
      WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
      ORDER BY (
        CASE 
          WHEN m.sender_id = ${userId} THEN m.receiver_id 
          ELSE m.sender_id 
        END
      ), m.created_at DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const formattedConversations = conversations.map(conv => ({
      otherUser: {
        id: conv.other_user_id,
        username: conv.other_user_username,
        fullName: conv.other_user_full_name,
        profileImage: conv.other_user_profile_image,
        isVerified: conv.other_user_is_verified,
        isOnline: conv.other_user_is_online,
        lastActive: conv.other_user_last_active
      },
      lastMessage: {
        id: conv.id,
        content: conv.content,
        messageType: conv.message_type,
        image: conv.image,
        video: conv.video,
        isRead: conv.is_read,
        createdAt: conv.created_at,
        senderId: conv.sender_id,
        receiverId: conv.receiver_id
      },
      unreadCount: conv.unread_count
    }));

    res.json({
      success: true,
      data: {
        conversations: formattedConversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
};

// Get conversation messages
const getConversationMessages = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, isBlocked: true }
    });

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if users are blocked
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Cannot access messages with blocked user'
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: {
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

    const total = await prisma.message.count({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation messages'
    });
  }
};

// Send message (HTTP endpoint - Socket.IO is preferred for real-time)
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', image, video } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send message to yourself'
      });
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isBlocked: true }
    });

    if (!receiver || receiver.isBlocked) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found or blocked'
      });
    }

    // Check if users are blocked
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Cannot send message to blocked user'
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        messageType,
        image,
        video
      },
      include: {
        sender: {
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

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: 'New Message',
        message: `${req.user.fullName || req.user.username} sent you a message`,
        type: 'message',
        data: JSON.stringify({ 
          senderId, 
          messageId: message.id 
        })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id },
      select: { receiverId: true, isRead: true }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark this message as read'
      });
    }

    if (message.isRead) {
      return res.status(400).json({
        success: false,
        error: 'Message already marked as read'
      });
    }

    await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read'
    });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id },
      select: { senderId: true, image: true, video: true }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    await prisma.message.delete({
      where: { id }
    });

    // Optionally delete media files from S3
    if (message.image) {
      const { deleteFileFromS3 } = require('../config/aws');
      await deleteFileFromS3(message.image);
    }
    if (message.video) {
      const { deleteFileFromS3 } = require('../config/aws');
      await deleteFileFromS3(message.video);
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
};

// Get unread messages count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
};

module.exports = {
  getConversations,
  getConversationMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount
};
