const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
