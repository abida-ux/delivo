const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

const PushSubscriptionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  endpoint: String,
  fcmToken: String,
  platform: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
}, { collection: 'pushsubscriptions' });

const PushSubscription = mongoose.model('PushSubscription', PushSubscriptionSchema);

async function cleanup() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Drop the problematic collections and let them recreate
    const db = mongoose.connection.db;
    
    try {
      await db.collection('pushsubscriptions').drop();
      console.log('✅ Dropped pushsubscriptions collection');
    } catch (err) {
      console.log('ℹ️ Collection drop error (may not exist):', err.message);
    }

    await mongoose.disconnect();
    console.log('✅ Cleanup complete');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  }
}

cleanup();
