# Firebase Cloud Messaging (FCM) Integration Guide

## Overview

This document describes the Firebase Cloud Messaging (FCM) integration for real-time push notifications in the Delivo food delivery application. The system sends notifications for:

1. **Order Creation** → Admin & Restaurant Owner & Customer
2. **Order Status Updates** → Customer & Rider (if assigned)
3. **Rider Assignment** → Rider
4. **Payment Confirmation** → Customer

---

## Backend Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# Optional: Firebase configuration URL
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### 2. Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save as `backend/config/firebase-service-account.json`

**Never commit this file to version control. Add to `.gitignore`:**

```
backend/config/firebase-service-account.json
```

### 3. Backend Dependencies

The Firebase Admin SDK is already added to `package.json`:

```bash
npm install firebase-admin@12.0.0
```

### 4. Notification Flow

#### Order Creation Flow:
```
Customer places order
    ↓
Order saved to database
    ↓
Notification service triggered
    ↓
├→ Create in-app notification (Admin, Restaurant, Customer)
├→ Send FCM notification to Admin
├→ Send FCM notification to Restaurant Owner
└→ Send FCM notification to Customer
```

#### Rider Assignment Flow:
```
Admin assigns rider to order
    ↓
Order status updated to 'assigned'
    ↓
Notification service triggered
    ↓
├→ Create in-app notification (Rider, Admin, Restaurant, Customer)
├→ Send FCM notification to Rider
├→ Send FCM notification to Admin
├→ Send FCM notification to Restaurant Owner
└→ Send FCM notification to Customer
```

---

## Frontend Setup

### 1. Environment Variables

Add these to your `.env.local` or `.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-public-key
```

### 2. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Copy the Web App config
5. For VAPID key:
   - Go to **Cloud Messaging** tab
   - Under **Web push certificates**, generate or copy the VAPID key

### 3. Frontend Installation

Firebase is already added to `frontend/package.json`:

```bash
npm install firebase@10.7.0
```

### 4. Service Worker

The file `frontend/public/firebase-messaging-sw.js` handles background notifications. This file:
- Listens for background FCM messages
- Displays notifications when app is closed/minimized
- Handles notification clicks to navigate users to relevant pages

---

## FCM Token Management

### Token Registration Flow

**When User Logs In:**
1. Request FCM token from Firebase
2. Save token to database via `/api/notifications/fcm/register`
3. Token is now active and can receive notifications

**When User Logs Out:**
1. Retrieve FCM token
2. Mark as inactive in database (soft delete)
3. Token can be reactivated on next login

**Token Refresh:**
- Firebase automatically handles token refresh
- New tokens are saved to database automatically
- Old tokens are marked inactive after 30 days of inactivity

**Invalid Tokens:**
- Automatically detected when Firebase rejects them
- Marked as inactive in database
- Won't be used for future notifications

### Database Schema

The `PushSubscription` model stores:

```javascript
{
  userId: ObjectId,           // User receiving notifications
  endpoint: String,            // Web Push endpoint (legacy)
  keys: {
    p256dh: String,           // Web Push encryption key
    auth: String,             // Web Push auth key
  },
  fcmToken: String,           // Firebase Cloud Messaging token
  platform: String,           // 'web', 'android', 'ios'
  isActive: Boolean,          // Whether token can receive notifications
  createdAt: Date,
  updatedAt: Date,
}
```

---

## Notification Events & Payloads

### Event 1: Order Created

**Triggered:** When order is successfully created and saved

**Recipients:**
- Admin (all admins)
- Restaurant owner (owner of selected restaurant)
- Customer (user who placed order)

**Payload Example:**
```javascript
{
  title: "New Order Received",
  message: "Jane Doe placed a new order for KES 1250 at Pizza Palace.",
  data: {
    eventType: "order_created",
    orderId: "507f1f77bcf86cd799439011",
    customerName: "Jane Doe",
    restaurantName: "Pizza Palace",
    amount: 1250,
    recipientRole: "admin"
  }
}
```

**Notification Click Action:** Opens `/admin/orders?orderId={orderId}`

### Event 2: Order Confirmed (Payment Completed)

**Triggered:** When M-Pesa payment is successful

**Recipients:** Customer

**Payload Example:**
```javascript
{
  title: "Order Confirmed 🎉",
  message: "Your order #A12345 has been received successfully. We're preparing your delivery.",
  data: {
    eventType: "order_placed_customer",
    orderId: "507f1f77bcf86cd799439011",
    amount: 1250,
    recipientRole: "customer"
  }
}
```

**Notification Click Action:** Opens `/customer/orders/{orderId}`

### Event 3: Rider Assigned

**Triggered:** When admin assigns order to a rider

**Recipients:**
- Rider (assigned rider)
- Admin, Restaurant Owner, Customer (notified of assignment)

**Payload Example:**
```javascript
{
  title: "New Delivery Assigned",
  message: "You have a new delivery assignment for order #A12345. Customer: Jane Doe",
  data: {
    eventType: "order_assigned_rider",
    orderId: "507f1f77bcf86cd799439011",
    customerName: "Jane Doe",
    recipientRole: "rider"
  }
}
```

**Notification Click Action:** Opens `/rider/deliveries?orderId={orderId}`

### Event 4: Order Status Updates

**Triggered:** When order status changes (preparing, on-delivery, delivered)

**Recipients:** Customer, Rider (if assigned)

**Payload Examples:**

#### Preparing:
```javascript
{
  title: "Order Being Prepared",
  message: "Your order #A12345 is being prepared at the restaurant."
}
```

#### On Delivery:
```javascript
{
  title: "Order On The Way",
  message: "Your order #A12345 is on its way to Kisii."
}
```

#### Delivered:
```javascript
{
  title: "Order Delivered",
  message: "Your order #A12345 has been successfully delivered."
}
```

---

## API Endpoints

### 1. Register FCM Token

**Endpoint:** `POST /api/notifications/fcm/register`

**Authentication:** Required (Bearer token)

**Request Body:**
```javascript
{
  fcmToken: "string",      // FCM token from Firebase
  platform: "web"          // 'web', 'android', 'ios' (default: 'web')
}
```

**Response:**
```javascript
{
  success: true,
  message: "FCM token registered successfully.",
  subscription: {
    _id: "...",
    userId: "...",
    fcmToken: "...",
    platform: "web",
    isActive: true,
    createdAt: "...",
    updatedAt: "..."
  }
}
```

### 2. Save Web Push Subscription (Legacy)

**Endpoint:** `POST /api/notifications/push/subscribe`

**Authentication:** Required (Bearer token)

**Request Body:**
```javascript
{
  endpoint: "string",    // Web Push endpoint
  keys: {
    p256dh: "string",   // Web Push encryption key
    auth: "string"      // Web Push auth key
  },
  fcmToken: "string"     // Optional FCM token
}
```

### 3. Send Test Notification

**Endpoint:** `POST /api/notifications/push/send`

**Authentication:** Required (Bearer token)

**Request Body:**
```javascript
{
  title: "Test Notification",
  message: "This is a test notification",
  userId: "user-id"      // Optional: send to specific user
}
```

---

## Frontend Integration

### 1. Initialize Firebase

Add to your main authentication component (e.g., `AuthContext.jsx` or `App.jsx`):

```javascript
import { initializeFirebase, requestFcmToken, saveFcmToken, listenForFcmMessages } from '../services/firebaseMessaging';

useEffect(() => {
  // Initialize Firebase
  initializeFirebase();

  // Setup FCM if user is authenticated
  if (user?.id) {
    (async () => {
      const token = await requestFcmToken();
      if (token) {
        await saveFcmToken(token, user.id);
      }
    })();

    // Listen for foreground messages
    listenForFcmMessages((notification) => {
      console.log('Notification received:', notification);
      // Display in-app notification if desired
    });
  }
}, [user?.id]);
```

### 2. Request Notification Permission

Add a button to request notification permission from the user:

```javascript
const handleNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    console.log('Notification permission granted');
    const token = await requestFcmToken();
    if (token) {
      await saveFcmToken(token, user.id);
    }
  }
};

return (
  <button onClick={handleNotificationPermission}>
    Enable Notifications
  </button>
);
```

### 3. In-App Notifications

Create a component to display in-app notifications when app is in foreground:

```javascript
import { listenForFcmMessages } from '../services/firebaseMessaging';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = listenForFcmMessages((notification) => {
      setNotifications(prev => [...prev, notification]);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 5000);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="notification-stack">
      {notifications.map((notif, idx) => (
        <div key={idx} className="notification-toast">
          <h4>{notif.title}</h4>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## Testing

### 1. Test FCM Token Registration

```bash
curl -X POST http://localhost:5000/api/notifications/fcm/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "fcmToken": "test-token-123",
    "platform": "web"
  }'
```

### 2. Test Notification Sending

```bash
curl -X POST http://localhost:5000/api/notifications/push/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "title": "Test",
    "message": "Test notification",
    "userId": "user-id"
  }'
```

### 3. Browser Console

Check browser console for Firebase initialization logs:

```javascript
// In browser console
firebase.messaging().getToken({
  vapidKey: 'your-vapid-key'
}).then(token => console.log(token))
```

---

## Troubleshooting

### FCM Token Not Generated

**Causes:**
- Service Worker not registered
- VAPID key not configured
- Browser doesn't support Web Push
- Notification permission denied

**Solutions:**
```javascript
// Check service worker registration
navigator.serviceWorker.ready.then(reg => {
  console.log('✅ Service Worker ready');
}).catch(err => {
  console.error('❌ Service Worker error:', err);
});

// Check notification permission
console.log('Notification permission:', Notification.permission);

// Check browser support
console.log('Service Workers supported:', 'serviceWorker' in navigator);
console.log('Push Manager supported:', 'PushManager' in window);
console.log('Notification API supported:', 'Notification' in window);
```

### Notifications Not Receiving

**Causes:**
- Token not saved to database
- Token marked as inactive
- Invalid token
- User not authorized to receive notification

**Solutions:**
```javascript
// Check stored subscriptions
db.collection('PushSubscription').find({ userId: 'user-id' })

// Check token status
db.collection('PushSubscription').find({ isActive: true })

// Regenerate token
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    if (sub) sub.unsubscribe();
  });
});
```

### Background Messages Not Showing

**Causes:**
- Service Worker not initialized
- Firebase not configured in service worker
- Missing notification title/body

**Check:** Firefox, Safari, or older browsers may have limited support for FCM

---

## Performance Considerations

1. **Async Notification Sending:** Notifications are sent asynchronously after order transaction completes
2. **Token Cleanup:** Invalid tokens are automatically marked inactive and skipped
3. **Batch Sending:** Multiple recipients are sent via multicast for efficiency
4. **Caching:** Firebase client SDK caches initialization

---

## Security Best Practices

1. **Never expose Firebase Admin credentials** to the frontend
2. **Service account key stored safely** (not in version control)
3. **Validate user identity** before registering tokens
4. **Use environment variables** for sensitive config
5. **Monitor token registration** for suspicious patterns
6. **Audit notification sends** in server logs

---

## Migration from Web Push to FCM

Existing Web Push subscriptions continue to work. New subscriptions use FCM for better mobile support.

### Upgrade Path:
1. Both Web Push and FCM work in parallel
2. Over time, users update their tokens to FCM
3. Old Web Push subscriptions remain active for backward compatibility
4. Can disable Web Push once all users migrated (if desired)

---

## References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## Support

For issues or questions about the FCM integration:
1. Check browser console for Firebase errors
2. Check server logs for notification sending errors
3. Verify environment variables are set correctly
4. Ensure Firebase project is properly configured
5. Test with curl or Postman before testing in app
