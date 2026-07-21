/**
 * Script to list all restaurants with their status
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected\n');

    const restaurants = await Restaurant.find()
      .select('name isOpen rating deliveryTime cuisine status ownerId')
      .populate('ownerId', 'name email');

    console.log(`📋 Total Restaurants: ${restaurants.length}\n`);
    
    if (restaurants.length === 0) {
      console.log('❌ No restaurants found in database');
    } else {
      restaurants.forEach((r, i) => {
        console.log(`${i + 1}. ${r.name}`);
        console.log(`   ID: ${r._id}`);
        console.log(`   Status: ${r.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}`);
        console.log(`   Rating: ${r.rating} ⭐`);
        console.log(`   Delivery: ${r.deliveryTime}`);
        console.log(`   Cuisine: ${r.cuisine.join(', ')}`);
        console.log(`   Owner: ${r.ownerId ? `${r.ownerId.name} (${r.ownerId.email})` : 'No owner'}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectDB();
