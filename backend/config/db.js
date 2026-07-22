const mongoose = require('mongoose');

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error (attempt ${retryCount + 1}): ${error.message}`);

    if (retryCount < 5) {
      console.log('🔄 Retrying MongoDB connection in 3 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return connectDB(retryCount + 1);
    } else {
      console.error('⚠️ Could not establish connection to MongoDB after 5 retries. Background reconnects will continue.');
    }
  }
};

module.exports = connectDB;


