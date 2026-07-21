# Firebase Cloud Messaging Configuration Template

Copy this file and fill in your Firebase credentials to enable FCM notifications.

## Backend Configuration

Create or update your `backend/.env` file with these variables:

```env
# ==================== FIREBASE CONFIGURATION ====================
# Firebase Admin SDK - Required for FCM to work
FIREBASE_PROJECT_ID=delivo-example
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# ==================== DATABASE ====================
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/delivo

# ==================== JWT & SECURITY ====================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ==================== ENVIRONMENT ====================
NODE_ENV=development
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:5174

# ==================== M-PESA PAYMENT ====================
# Get these from Safaricom Daraja API
MPESA_KEY=your-consumer-key
MPESA_SECRET=your-consumer-secret
MPESA_BUSINESS_SHORTCODE=123456
MPESA_PASS_KEY=your-pass-key
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback

# ==================== EMAIL ====================
# Gmail or other SMTP provider
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@delivo.com

# ==================== VAPID KEYS (Web Push Legacy) ====================
# Get from your Firebase project settings > Cloud Messaging > Web push certificates
VAPID_PUBLIC_KEY=BLF...your-vapid-public-key
VAPID_PRIVATE_KEY=...your-vapid-private-key
```

## Frontend Configuration

Create a `frontend/.env.local` file with these variables:

```env
# ==================== FIREBASE SDK CONFIGURATION ====================
# Get these from Firebase Console > Project Settings > General
VITE_FIREBASE_API_KEY=AIzaSyExample1234567890_ABCDEFGHIJKLMNOPQRSTUVWXYZab
VITE_FIREBASE_AUTH_DOMAIN=delivo-example.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=delivo-example
VITE_FIREBASE_STORAGE_BUCKET=delivo-example.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789jk

# ==================== FIREBASE CLOUD MESSAGING ====================
# Get from Firebase Console > Project Settings > Cloud Messaging > Web push certificates
VITE_FIREBASE_VAPID_KEY=BLF1234567890_ABCDEFGHIJKLMNOPQRSTUVWXYZ_ABCDEFGHIJKLMNOPQRST

# ==================== API CONFIGURATION ====================
VITE_API_URL=http://localhost:5000/api
```

## How to Get Firebase Credentials

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project"
3. Enter "delivo" as project name
4. Accept terms and create project

### Step 2: Get Web App Credentials

1. Go to Project Settings (⚙️ icon)
2. Click "General" tab
3. Under "Your apps", click "Create app" or select Web option
4. Select "Web"
5. Copy the firebaseConfig object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",              // → VITE_FIREBASE_API_KEY
     authDomain: "delivo...firebase.com", // → VITE_FIREBASE_AUTH_DOMAIN
     projectId: "delivo-...",           // → VITE_FIREBASE_PROJECT_ID
     storageBucket: "delivo-...appspot.com", // → VITE_FIREBASE_STORAGE_BUCKET
     messagingSenderId: "123456789",   // → VITE_FIREBASE_MESSAGING_SENDER_ID
     appId: "1:123456789:web:abc123def456", // → VITE_FIREBASE_APP_ID
   };
   ```

### Step 3: Enable Cloud Messaging

1. Go to "Cloud Messaging" tab in Project Settings
2. Under "Web push certificates", if none exists:
   - Click "Generate Key Pair"
3. Copy the public key as VITE_FIREBASE_VAPID_KEY

### Step 4: Create Service Account for Backend

1. Go to Project Settings > "Service Accounts" tab
2. Click "Generate New Private Key" (at the bottom)
3. A JSON file downloads automatically
4. Save as `backend/config/firebase-service-account.json`
   - **IMPORTANT:** Never commit this to Git! Add to .gitignore
5. File contents look like:
   ```json
   {
     "type": "service_account",
     "project_id": "delivo-example",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xyz@delivo-example.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     ...
   }
   ```

### Step 5: Update Backend .env

```env
FIREBASE_PROJECT_ID=delivo-example
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

The path should be relative to `backend/server.js`

## Verification Checklist

### Backend
- [ ] `backend/.env` has `FIREBASE_PROJECT_ID`
- [ ] `backend/config/firebase-service-account.json` exists and has valid JSON
- [ ] File is added to `.gitignore` (check with: `git check-ignore backend/config/firebase-service-account.json`)
- [ ] All required env variables are set

### Frontend
- [ ] `frontend/.env.local` has all VITE_FIREBASE_* variables
- [ ] All values match Firebase Console settings
- [ ] No quotes around environment variable values

### Firebase Console
- [ ] Project created and active
- [ ] Cloud Messaging enabled
- [ ] Service Account exists
- [ ] Web app configured
- [ ] VAPID key generated

## Testing Configuration

### Test Backend Firebase Connection

```bash
cd backend
npm start
```

Check server logs for:
```
✅ Firebase Admin SDK initialized successfully
```

### Test Frontend Firebase

Open browser DevTools (F12) and type:
```javascript
firebase.app()  // Should return app object
```

Check for:
```
✅ Firebase initialized successfully
```

## Troubleshooting

### Firebase not initializing backend

**Error:** `Error: Firebase initialization failed`

**Solutions:**
1. Check `FIREBASE_PROJECT_ID` is correct
2. Check `firebase-service-account.json` file path
3. Verify JSON file is valid (use jsonlint.com)
4. Check file contains `private_key` field

### Can't get VAPID key

**Solutions:**
1. Go to Firebase Console > Project Settings > Cloud Messaging
2. Under "Web push certificates", click "Generate Key Pair"
3. Public key should appear immediately
4. Copy entire key value

### FCM token not generating frontend

**Solutions:**
1. Check `VITE_FIREBASE_API_KEY` is correct
2. Ensure service worker registered (F12 > Application > Service Workers)
3. Allow notification permission when prompted
4. Clear browser cache and cookies

## Production Deployment

### Environment Variables on Hosting

For Vercel, Render, or similar:

1. Go to your deployment dashboard
2. Add environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - etc.

3. For backend:
   - Upload `firebase-service-account.json` as a secret environment variable
   - Set `FIREBASE_SERVICE_ACCOUNT_PATH` to `/etc/secrets/firebase-service-account.json`
   - Or base64 encode and use `FIREBASE_SERVICE_ACCOUNT_JSON` env variable

### Security Notes

- 🔒 Never commit `firebase-service-account.json`
- 🔒 Never share `FIREBASE_PROJECT_ID` in public repos
- 🔒 VAPID public key is OK to be public (frontend use)
- 🔒 Keep `VITE_FIREBASE_API_KEY` reasonably secret (though harder to protect in frontend)

## Support

For issues:
1. Check all environment variables are set correctly
2. Verify Firebase project is active
3. Check browser console for errors
4. Check server logs for Firebase errors
5. Refer to `FCM_INTEGRATION_GUIDE.md` for detailed troubleshooting

## Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Messaging Setup](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Guide](https://firebase.google.com/docs/cloud-messaging/js/client)
