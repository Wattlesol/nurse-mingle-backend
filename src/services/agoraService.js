const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-token');
const prisma = require('../config/database');

class AgoraService {
  constructor() {
    this.appId = process.env.AGORA_APP_ID;
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE;
    this.tokenExpiryTime = parseInt(process.env.LIVE_TOKEN_EXPIRY) || 3600; // 1 hour default
  }

  // Generate RTC token for voice/video calls
  generateRtcToken(channelName, uid, role = RtcRole.PUBLISHER) {
    try {
      if (!this.appId || !this.appCertificate) {
        throw new Error('Agora credentials not configured');
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + this.tokenExpiryTime;

      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs
      );

      return {
        success: true,
        token,
        appId: this.appId,
        channelName,
        uid,
        expiresAt: new Date(privilegeExpiredTs * 1000)
      };
    } catch (error) {
      console.error('Generate RTC token error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate RTM token for messaging
  generateRtmToken(userId) {
    try {
      if (!this.appId || !this.appCertificate) {
        throw new Error('Agora credentials not configured');
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + this.tokenExpiryTime;

      const token = RtmTokenBuilder.buildToken(
        this.appId,
        this.appCertificate,
        userId,
        RtmRole.Rtm_User,
        privilegeExpiredTs
      );

      return {
        success: true,
        token,
        appId: this.appId,
        userId,
        expiresAt: new Date(privilegeExpiredTs * 1000)
      };
    } catch (error) {
      console.error('Generate RTM token error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate token for live streaming
  async generateLiveStreamToken(userId, channelName, isHost = false) {
    try {
      const role = isHost ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const uid = parseInt(userId.replace(/\D/g, '').slice(-9)) || Math.floor(Math.random() * 1000000);

      const tokenResult = this.generateRtcToken(channelName, uid, role);
      
      if (!tokenResult.success) {
        return tokenResult;
      }

      // Store token in database
      await prisma.agoraToken.create({
        data: {
          userId,
          channel: channelName,
          token: tokenResult.token,
          expiresAt: tokenResult.expiresAt,
          type: 'rtc'
        }
      });

      return {
        success: true,
        ...tokenResult,
        role: isHost ? 'host' : 'audience'
      };
    } catch (error) {
      console.error('Generate live stream token error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate token for voice/video calls
  async generateCallToken(callerId, receiverId, callType = 'video') {
    try {
      // Create unique channel name for the call
      const channelName = `call_${[callerId, receiverId].sort().join('_')}_${Date.now()}`;
      
      // Generate UIDs
      const callerUid = parseInt(callerId.replace(/\D/g, '').slice(-9)) || Math.floor(Math.random() * 1000000);
      const receiverUid = parseInt(receiverId.replace(/\D/g, '').slice(-9)) || Math.floor(Math.random() * 1000000);

      // Generate tokens for both users
      const callerToken = this.generateRtcToken(channelName, callerUid, RtcRole.PUBLISHER);
      const receiverToken = this.generateRtcToken(channelName, receiverUid, RtcRole.PUBLISHER);

      if (!callerToken.success || !receiverToken.success) {
        throw new Error('Failed to generate tokens');
      }

      // Store tokens in database
      await prisma.$transaction([
        prisma.agoraToken.create({
          data: {
            userId: callerId,
            channel: channelName,
            token: callerToken.token,
            expiresAt: callerToken.expiresAt,
            type: 'rtc'
          }
        }),
        prisma.agoraToken.create({
          data: {
            userId: receiverId,
            channel: channelName,
            token: receiverToken.token,
            expiresAt: receiverToken.expiresAt,
            type: 'rtc'
          }
        })
      ]);

      return {
        success: true,
        channelName,
        appId: this.appId,
        callType,
        caller: {
          uid: callerUid,
          token: callerToken.token
        },
        receiver: {
          uid: receiverUid,
          token: receiverToken.token
        },
        expiresAt: callerToken.expiresAt
      };
    } catch (error) {
      console.error('Generate call token error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate and refresh token if needed
  async validateToken(userId, channelName) {
    try {
      const storedToken = await prisma.agoraToken.findFirst({
        where: {
          userId,
          channel: channelName,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (storedToken) {
        return {
          success: true,
          token: storedToken.token,
          expiresAt: storedToken.expiresAt
        };
      }

      // Generate new token if expired or not found
      const uid = parseInt(userId.replace(/\D/g, '').slice(-9)) || Math.floor(Math.random() * 1000000);
      const newToken = this.generateRtcToken(channelName, uid);

      if (newToken.success) {
        // Store new token
        await prisma.agoraToken.create({
          data: {
            userId,
            channel: channelName,
            token: newToken.token,
            expiresAt: newToken.expiresAt,
            type: 'rtc'
          }
        });
      }

      return newToken;
    } catch (error) {
      console.error('Validate token error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clean up expired tokens
  async cleanupExpiredTokens() {
    try {
      const result = await prisma.agoraToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`Cleaned up ${result.count} expired Agora tokens`);
      return result.count;
    } catch (error) {
      console.error('Cleanup expired tokens error:', error);
      return 0;
    }
  }

  // Record call history
  async recordCallHistory(callerId, receiverId, type, status, duration = null) {
    try {
      await prisma.callHistory.create({
        data: {
          callerId,
          receiverId,
          type,
          status,
          duration,
          startedAt: status === 'completed' ? new Date(Date.now() - (duration * 1000)) : null,
          endedAt: status === 'completed' ? new Date() : null
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Record call history error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get call history for user
  async getCallHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const calls = await prisma.callHistory.findMany({
        where: {
          OR: [
            { callerId: userId },
            { receiverId: userId }
          ]
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.callHistory.count({
        where: {
          OR: [
            { callerId: userId },
            { receiverId: userId }
          ]
        }
      });

      return {
        success: true,
        data: {
          calls,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get call history error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const agoraService = new AgoraService();

// Schedule cleanup of expired tokens every hour
setInterval(() => {
  agoraService.cleanupExpiredTokens();
}, 60 * 60 * 1000);

module.exports = agoraService;
