const mongoose = require('mongoose');
const Logger = require('../utils/logger');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/planning-poker', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    Logger.log('MongoDB connected successfully');
  } catch (error) {
    Logger.error(`MongoDB connection error: ${error}`);
    throw error;
  }
}

module.exports = {
  connectDB
}; 