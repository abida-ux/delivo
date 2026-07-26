const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI;
console.log('Using MONGO_URI:', uri ? uri.substring(0, 30) + '...' : 'undefined');

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ Success! Connected to MongoDB host: ${conn.connection.host}`);
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
    process.exit(1);
  }
}

testConnection();
