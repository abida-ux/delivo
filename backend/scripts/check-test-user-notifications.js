const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const main = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('NO_MONGO_URI');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  const user = await User.findOne({ email: 'testi@gmail.com' }).lean();
  console.log('USER:', user ? { id: user._id.toString(), email: user.email, role: user.role } : null);

  if (user) {
    const subs = await PushSubscription.find({ userId: user._id }).lean();
    console.log('SUBSCRIPTIONS:', subs.map((s) => ({
      id: s._id.toString(),
      endpoint: s.endpoint || null,
      fcmToken: s.fcmToken ? `${s.fcmToken.substring(0, 20)}...` : null,
      platform: s.platform,
      isActive: s.isActive,
    })));
  }

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});