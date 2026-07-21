const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
        let serviceAccount = null;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
      ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : path.join(__dirname, '../config/firebase-service-account.json');

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (jsonError) {
        throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${jsonError.message}`);
      }
    } else if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }

    if (!serviceAccount) {
      throw new Error(`Service account not found. Checked path: ${serviceAccountPath}`);
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
};

const ensureFirebaseInitialized = () => {
  if (!admin.apps || admin.apps.length === 0) {
    initializeFirebase();
  }
};

const sendFcmMessage = async ({ fcmToken, payload = {} }) => {
  if (!fcmToken) {
    return { ok: false, error: 'No FCM token provided' };
  }

  try {
    ensureFirebaseInitialized();
    const messaging = admin.messaging();

    const message = {
      notification: {
        title: payload.title || 'Delivo Update',
        body: payload.message || 'You have a new update from Delivo.',
      },
      data: {
        eventType: payload.data?.eventType || 'notification',
        orderId: payload.data?.orderId || '',
        recipientRole: payload.data?.recipientRole || '',
        clickAction: payload.url || '/',
      },
      token: fcmToken,
    };

    const response = await messaging.send(message);
    console.log('✅ FCM notification sent:', response);
    return { ok: true, messageId: response };
  } catch (error) {
    console.error('❌ FCM send failed:', error.message);

    if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
      return { ok: false, error, removeToken: true };
    }

    return { ok: false, error };
  }
};

const sendMulticastFcmMessages = async ({ fcmTokens = [], payload = {} }) => {
  if (!fcmTokens || fcmTokens.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  try {
    ensureFirebaseInitialized();
    const messaging = admin.messaging();

    const message = {
      notification: {
        title: payload.title || 'Delivo Update',
        body: payload.message || 'You have a new update from Delivo.',
      },
      data: {
        eventType: payload.data?.eventType || 'notification',
        orderId: payload.data?.orderId || '',
        recipientRole: payload.data?.recipientRole || '',
        clickAction: payload.url || '/',
      },
    };

    const response = await messaging.sendMulticast({
      ...message,
      tokens: fcmTokens,
    });

    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(fcmTokens[idx]);
        }
      }
    });

    console.log(`✅ Multicast FCM sent: ${response.successCount} sent, ${response.failureCount} failed`);
    return {
      sent: response.successCount,
      failed: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error('❌ Multicast FCM failed:', error.message);
    return { sent: 0, failed: fcmTokens.length, invalidTokens: [] };
  }
};

const subscribeToTopic = async ({ fcmToken, topic }) => {
  try {
    const messaging = admin.messaging();
    await messaging.subscribeToTopic([fcmToken], topic);
    console.log(`✅ Subscribed token to topic: ${topic}`);
    return { ok: true };
  } catch (error) {
    console.error(`❌ Topic subscription failed: ${error.message}`);
    return { ok: false, error };
  }
};

const unsubscribeFromTopic = async ({ fcmToken, topic }) => {
  try {
    const messaging = admin.messaging();
    await messaging.unsubscribeFromTopic([fcmToken], topic);
    console.log(`✅ Unsubscribed token from topic: ${topic}`);
    return { ok: true };
  } catch (error) {
    console.error(`❌ Topic unsubscription failed: ${error.message}`);
    return { ok: false, error };
  }
};

module.exports = {
  initializeFirebase,
  sendFcmMessage,
  sendMulticastFcmMessages,
  subscribeToTopic,
  unsubscribeFromTopic,
};
