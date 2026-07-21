/**
 * Create a test user for demo/testing purposes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected\n');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'testcustomer@example.com' });
    if (existingUser) {
      console.log('✓ Test user already exists:');
      console.log(`  Email: testcustomer@example.com`);
      console.log(`  Password: Test123456`);
      console.log(`  ID: ${existingUser._id}`);
      process.exit(0);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test123456', salt);

    // Create test user
    const testUser = new User({
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      password: hashedPassword,
      phone: '+254700000000',
      role: 'customer',
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log(`\n📧 Email: testcustomer@example.com`);
    console.log(`🔑 Password: Test123456`);
    console.log(`👤 User ID: ${testUser._id}`);
    console.log(`\nUse these credentials to log in and place a test order.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUser();
