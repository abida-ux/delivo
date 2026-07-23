require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const admins = await User.find({ role: 'admin' }).select('name email phone role').lean();
    const riders = await User.find({ role: 'rider' }).select('name email phone role').lean();
    console.log('admins', admins.length);
    console.log(JSON.stringify(admins, null, 2));
    console.log('riders', riders.length);
    console.log(JSON.stringify(riders, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
})();
