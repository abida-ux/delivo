/**
 * Script to set all restaurants to isOpen: true
 * Run this once to enable orders for testing push notifications
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Update all restaurants to isOpen: true
    const result = await Restaurant.updateMany(
      {},
      { isOpen: true },
      { new: true }
    );

    console.log(`✅ Updated ${result.modifiedCount} restaurants to isOpen: true`);
    console.log(`📊 Matched: ${result.matchedCount} restaurants`);

    // Show restaurants
    const restaurants = await Restaurant.find().select('name isOpen');
    console.log('\n📋 All restaurants:');
    restaurants.forEach(r => {
      console.log(`  ✓ ${r.name}: ${r.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectDB();
