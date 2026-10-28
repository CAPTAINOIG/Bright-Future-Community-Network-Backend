const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

const connectDB = async () => {
  if (!config.mongodb.uri) {
    logger.error('MONGODB_URI environment variable is not set. MongoDB connection skipped.');
    logger.warn('Set MONGODB_URI in your Render dashboard Environment Variables.');
    return false;
  }

  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      bufferCommands: false,
      maxIdleTimeMS: 45000,
    };

    await mongoose.connect(config.mongodb.uri, options);

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return true;
  } catch (err) {
    logger.error('MongoDB connection error:', err.message);
    logger.warn('Server will continue running without a database connection. Set MONGODB_URI to enable full features.');
    return false;
  }
};

module.exports = connectDB;
