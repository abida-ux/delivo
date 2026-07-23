require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('connected');

    const allRiders = await User.find({ role: 'rider' }).select('name email phone riderStatus currentOrderId').lean();
    console.log(`all riders: ${allRiders.length}`);
    allRiders.forEach((r) => console.log(JSON.stringify(r)));

    const activeOrderStatuses = ['pending', 'confirmed', 'preparing', 'assigned', 'out-for-delivery', 'on-delivery'];
    const busyRiderIds = await Order.distinct('riderId', {
      status: { $in: activeOrderStatuses },
      riderId: { $ne: null },
    });
    console.log(`busy rider ids: ${busyRiderIds.length}`);
    console.log(JSON.stringify(busyRiderIds));

    const availableRiders = await User.find({ role: 'rider', _id: { $nin: busyRiderIds } }).select('name email phone riderStatus currentOrderId').lean();
    console.log(`available riders: ${availableRiders.length}`);
    availableRiders.forEach((r) => console.log(JSON.stringify(r)));
  } catch (error) {
    console.error('error', error);
  } finally {
    await mongoose.disconnect();
  }
})();
