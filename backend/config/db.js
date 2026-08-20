const mongoose = require('mongoose');

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error (attempt ${retryCount + 1}): ${error.message}`);

    if (retryCount < 3) {
      console.log('Retrying MongoDB connection in 2 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return connectDB(retryCount + 1);
    } else {
      console.error('Could not establish connection to MongoDB after 3 retries.');
    }
  }
};

module.exports = connectDB;


