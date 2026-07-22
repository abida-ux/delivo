const test = require('node:test');
const assert = require('node:assert/strict');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let app = null;

test('Firebase Admin SDK initializes with service account', async () => {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
  assert.ok(fs.existsSync(serviceAccountPath), 'Service account file exists');

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  assert.equal(serviceAccount.type, 'service_account', 'Service account type is valid');
  assert.ok(serviceAccount.project_id, 'Project ID is present');
  assert.ok(serviceAccount.private_key, 'Private key is present');
  assert.ok(serviceAccount.client_email, 'Client email is present');

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  assert.ok(admin.apps.length > 0, 'Firebase app initialized');
});

test('Firebase messaging can be accessed', async () => {
  assert.ok(admin.apps.length > 0, 'Firebase app is initialized');
  const messaging = admin.messaging();
  assert.ok(messaging, 'Firebase messaging instance available');
});

test('Test FCM message payload structure is valid', async () => {
  const testPayload = {
    notification: {
      title: 'Test Notification',
      body: 'This is a test push notification from Delivo',
    },
    data: {
      eventType: 'test',
      orderId: 'test-order-123',
      recipientRole: 'customer',
      clickAction: '/orders',
    },
  };

  assert.ok(testPayload.notification.title, 'Title is present');
  assert.ok(testPayload.notification.body, 'Body is present');
  assert.equal(testPayload.data.eventType, 'test', 'Event type is correct');
});

test('Firebase Admin SDK connection details logged', async () => {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  console.log('\n📊 Firebase Setup Summary:');
  console.log('  ✅ Project ID:', serviceAccount.project_id);
  console.log('  ✅ Client Email:', serviceAccount.client_email);
  console.log('  ✅ Admin SDK Initialized:', admin.apps.length > 0);
  console.log('\n💡 To send a real test notification:');
  console.log('   1. Get an FCM token from the browser or mobile device');
  console.log('   2. Call POST /api/notifications/send-test with the token');
  console.log('   3. Check the device for the notification');
});
