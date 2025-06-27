const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      // Handle private key formatting for different deployment environments (especially Coolify)
      let privateKey;

      // Option 1: Try base64 encoded key first (recommended for Coolify)
      if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
        try {
          privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
          console.log('✅ Using base64 encoded Firebase private key');
        } catch (error) {
          console.error('❌ Failed to decode base64 private key:', error.message);
        }
      }

      // Option 2: Use regular private key with newline handling
      if (!privateKey && process.env.FIREBASE_PRIVATE_KEY) {
        privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');

        // Additional handling for containerized environments like Coolify
        // Sometimes the key gets double-escaped or malformed
        if (!privateKey.includes('\n') || privateKey.split('\n').length < 3) {
          console.log('🔧 Attempting to fix malformed private key for containerized deployment...');

          // Remove any existing formatting
          let cleanKey = privateKey
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/\s+/g, '');

          // Reconstruct proper PEM format with correct line breaks
          const lines = [];
          for (let i = 0; i < cleanKey.length; i += 64) {
            lines.push(cleanKey.substring(i, i + 64));
          }

          privateKey = '-----BEGIN PRIVATE KEY-----\n' +
                      lines.join('\n') +
                      '\n-----END PRIVATE KEY-----';
        }
      }

      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.error('💡 Tip: For Coolify deployment, ensure FIREBASE_PRIVATE_KEY is properly escaped');
    // Don't throw error to allow app to start without Firebase
  }
};

// Verify Firebase ID token
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      user: decodedToken,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get user by UID
const getFirebaseUser = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return {
      success: true,
      user: userRecord,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send push notification
const sendPushNotification = async (token, notification, data = {}) => {
  try {
    const message = {
      notification,
      data,
      token,
    };

    const response = await admin.messaging().send(message);
    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send push notification to multiple tokens
const sendMulticastNotification = async (tokens, notification, data = {}) => {
  try {
    const message = {
      notification,
      data,
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    return {
      success: true,
      response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  initializeFirebase,
  verifyFirebaseToken,
  getFirebaseUser,
  sendPushNotification,
  sendMulticastNotification,
  admin,
};
