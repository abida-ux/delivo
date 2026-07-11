const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('🔧 Troubleshooting tips:');
    console.error('1. Check if your IP is whitelisted in MongoDB Atlas (Security -> IP Whitelist)');
    console.error('2. Verify MONGO_URI in .env file');
    console.error('3. Ensure MongoDB Atlas cluster is active');
    process.exit(1);
  }
};

module.exports = connectDB;
