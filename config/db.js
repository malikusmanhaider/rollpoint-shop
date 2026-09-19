const mongoose = require('mongoose');
const { seedDatabase } = require('./seed');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 8000,
  };

  // 1. Try MongoDB Atlas if URI is provided in .env
  if (uri && uri.trim() !== '' && !uri.includes('<username>')) {
    try {
      console.log('🔄 Connecting to MongoDB Atlas...');
      await mongoose.connect(uri.trim(), mongooseOptions);
      console.log('✅ Connected successfully to MongoDB Atlas!');
      await seedDatabase();
      return true;
    } catch (err) {
      console.error('❌ MongoDB Atlas connection failed:', err.message);
      console.warn('⚠️ Falling back to local MongoDB connection...');
    }
  }

  // 2. Try Local MongoDB service
  try {
    const localUri = 'mongodb://127.0.0.1:27017/rollpoint';
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2500 });
    console.log('✅ Connected to local MongoDB instance (mongodb://127.0.0.1:27017/rollpoint)');
    await seedDatabase();
    return true;
  } catch (localErr) {
    console.log('ℹ️ No active MongoDB service detected on localhost:27017.');
    console.log('👉 To connect to your real MongoDB Atlas cluster, set MONGODB_URI in your .env file.');
  }

  return false;
}

module.exports = { connectDB };
