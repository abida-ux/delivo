require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const fetch = globalThis.fetch || require('node-fetch');
const jwt = require('jsonwebtoken');
const orderRoutes = require('./routes/orderRoutes');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('DB connected');

    const adminUser = await User.findOne({ role: 'admin' }).lean();
    const authUser = adminUser || await User.findOne({ role: 'rider' }).lean();
    if (!authUser) {
      throw new Error('No admin or rider user found in DB');
    }
    console.log('Using auth user:', { id: authUser._id.toString(), role: authUser.role, email: authUser.email });

    const token = jwt.sign({ id: authUser._id.toString(), role: authUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated token length', token.length);

    const app = express();
    app.use(express.json());
    app.use('/api/orders', orderRoutes);

    const server = app.listen(5050, async () => {
      console.log('Test app listening on 5050');
      try {
        const res = await fetch('http://localhost:5050/api/orders/rider/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log('status', res.status);
        console.log('response', JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('request error', error);
      } finally {
        server.close(async () => {
          await mongoose.disconnect();
          console.log('server closed, db disconnected');
        });
      }
    });
  } catch (error) {
    console.error('error', error);
    await mongoose.disconnect();
    process.exit(1);
  }
})();
