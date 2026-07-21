const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

const PushSubscription = require('../models/PushSubscription');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const main = async () => {
  if (!process.env.MONGO_URI) {
    console.error('NO_MONGO_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const total = await PushSubscription.countDocuments();
  const fcmCount = await PushSubscription.countDocuments({ fcmToken: { $exists: true, $ne: null } });
  const activeCount = await PushSubscription.countDocuments({ isActive: true });
  const activeFcmCount = await PushSubscription.countDocuments({ isActive: true, fcmToken: { $exists: true, $ne: null } });
  const activeBrowserCount = await PushSubscription.countDocuments({ isActive: true, endpoint: { $exists: true, $ne: null } });
  const latest = await PushSubscription.find().sort({ updatedAt: -1 }).limit(5).lean();

  console.log({ total, fcmCount, activeCount, activeFcmCount, activeBrowserCount });
  console.log('LATEST:', latest.map((s) => ({ id: s._id.toString(), userId: s.userId?.toString?.() || null, endpoint: s.endpoint || null, fcmToken: s.fcmToken ? `${s.fcmToken.substring(0, 25)}...` : null, platform: s.platform, isActive: s.isActive, updatedAt: s.updatedAt })));

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});