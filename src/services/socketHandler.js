const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// Store active connections
const activeUsers = new Map();

const socketHandler = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          profileImage: true,
          isBlocked: true
        }
      });

      if (!user || user.isBlocked) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected: ${socket.id}`);

    // Store user connection
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date()
    });

    // Update user online status
    await prisma.user.update({
      where: { id: socket.userId },
      data: { 
        isOnline: true,
        lastActive: new Date()
      }
    });

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Notify friends that user is online
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      user: socket.user
    });

    // Handle joining chat rooms
    socket.on('join_chat', async (data) => {
      try {
        const { receiverId } = data;
        
        // Create chat room ID (consistent ordering)
        const chatRoomId = [socket.userId, receiverId].sort().join('_');
        socket.join(chatRoomId);
        
        console.log(`User ${socket.userId} joined chat room: ${chatRoomId}`);
        
        // Mark messages as read
        await prisma.message.updateMany({
          where: {
            senderId: receiverId,
            receiverId: socket.userId,
            isRead: false
          },
          data: { isRead: true }
        });

        socket.emit('joined_chat', { chatRoomId, receiverId });
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, messageType = 'text', image, video } = data;

        // Validate receiver
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
          select: { id: true, isBlocked: true }
        });

        if (!receiver || receiver.isBlocked) {
          return socket.emit('error', { message: 'Receiver not found or blocked' });
        }

        // Check if users are blocked
        const isBlocked = await prisma.blockedUser.findFirst({
          where: {
            OR: [
              { blockerId: socket.userId, blockedId: receiverId },
              { blockerId: receiverId, blockedId: socket.userId }
            ]
          }
        });

        if (isBlocked) {
          return socket.emit('error', { message: 'Cannot send message to blocked user' });
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            senderId: socket.userId,
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
                profileImage: true
              }
            }
          }
        });

        // Create chat room ID
        const chatRoomId = [socket.userId, receiverId].sort().join('_');

        // Send message to chat room
        io.to(chatRoomId).emit('new_message', message);

        // Send push notification to receiver if offline
        const receiverConnection = activeUsers.get(receiverId);
        if (!receiverConnection) {
          // Send push notification
          await prisma.notification.create({
            data: {
              userId: receiverId,
              title: `New message from ${socket.user.fullName || socket.user.username}`,
              message: content || 'Sent a media file',
              type: 'message',
              data: JSON.stringify({ 
                senderId: socket.userId,
                messageId: message.id 
              })
            }
          });
        }

        console.log(`Message sent from ${socket.userId} to ${receiverId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      const chatRoomId = [socket.userId, receiverId].sort().join('_');
      
      socket.to(chatRoomId).emit('user_typing', {
        userId: socket.userId,
        user: socket.user
      });
    });

    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      const chatRoomId = [socket.userId, receiverId].sort().join('_');
      
      socket.to(chatRoomId).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });

    // Handle live streaming events
    socket.on('join_live_room', (data) => {
      const { roomId } = data;
      socket.join(`live_${roomId}`);
      
      // Notify room about new viewer
      socket.to(`live_${roomId}`).emit('viewer_joined', {
        userId: socket.userId,
        user: socket.user
      });
    });

    socket.on('leave_live_room', (data) => {
      const { roomId } = data;
      socket.leave(`live_${roomId}`);
      
      // Notify room about viewer leaving
      socket.to(`live_${roomId}`).emit('viewer_left', {
        userId: socket.userId
      });
    });

    // Handle live comments
    socket.on('live_comment', async (data) => {
      try {
        const { roomId, comment } = data;
        
        // Broadcast comment to live room
        io.to(`live_${roomId}`).emit('new_live_comment', {
          userId: socket.userId,
          user: socket.user,
          comment,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Live comment error:', error);
      }
    });

    // Handle gifts in live streams
    socket.on('send_live_gift', async (data) => {
      try {
        const { roomId, receiverId, giftType, giftName, price } = data;

        // Deduct diamonds from sender
        const sender = await prisma.user.findUnique({
          where: { id: socket.userId },
          select: { diamonds: true }
        });

        if (sender.diamonds < price) {
          return socket.emit('error', { message: 'Insufficient diamonds' });
        }

        // Process gift transaction
        await prisma.$transaction([
          // Deduct diamonds from sender
          prisma.user.update({
            where: { id: socket.userId },
            data: { diamonds: { decrement: price } }
          }),
          // Add coins to receiver
          prisma.user.update({
            where: { id: receiverId },
            data: { coins: { increment: price } }
          }),
          // Record gift
          prisma.gift.create({
            data: {
              senderId: socket.userId,
              receiverId,
              giftType,
              giftName,
              price
            }
          })
        ]);

        // Broadcast gift to live room
        io.to(`live_${roomId}`).emit('live_gift_sent', {
          sender: socket.user,
          receiverId,
          giftType,
          giftName,
          price,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Send live gift error:', error);
        socket.emit('error', { message: 'Failed to send gift' });
      }
    });

    // Handle voice/video call events
    socket.on('call_user', async (data) => {
      const { receiverId, type, agoraToken, channelName } = data;
      
      const receiverConnection = activeUsers.get(receiverId);
      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit('incoming_call', {
          callerId: socket.userId,
          caller: socket.user,
          type,
          agoraToken,
          channelName
        });
      }
    });

    socket.on('call_response', (data) => {
      const { callerId, accepted, agoraToken, channelName } = data;
      
      const callerConnection = activeUsers.get(callerId);
      if (callerConnection) {
        io.to(callerConnection.socketId).emit('call_response', {
          receiverId: socket.userId,
          receiver: socket.user,
          accepted,
          agoraToken,
          channelName
        });
      }
    });

    socket.on('call_ended', (data) => {
      const { otherUserId } = data;
      
      const otherConnection = activeUsers.get(otherUserId);
      if (otherConnection) {
        io.to(otherConnection.socketId).emit('call_ended', {
          userId: socket.userId
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected: ${socket.id}`);

      // Remove from active users
      activeUsers.delete(socket.userId);

      // Update user offline status
      await prisma.user.update({
        where: { id: socket.userId },
        data: { 
          isOnline: false,
          lastActive: new Date()
        }
      });

      // Notify friends that user is offline
      socket.broadcast.emit('user_offline', {
        userId: socket.userId
      });
    });
  });

  // Utility function to send notification to user
  const sendNotificationToUser = (userId, notification) => {
    const userConnection = activeUsers.get(userId);
    if (userConnection) {
      io.to(userConnection.socketId).emit('notification', notification);
    }
  };

  // Export utility functions
  io.sendNotificationToUser = sendNotificationToUser;
  io.activeUsers = activeUsers;
};

module.exports = socketHandler;
