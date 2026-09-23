const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

const connectDB = async () => {
  if (!config.mongodb.uri) {
    logger.error('MONGODB_URI environment variable is not set. MongoDB connection skipped.');
    logger.warn('Set MONGODB_URI in your Render dashboard Environment Variables.');
    return;
  }

  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(config.mongodb.uri, options);

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (err) {
    logger.error('MongoDB connection error:', err.message);
    logger.warn('Server will continue running without a database connection. Set MONGODB_URI to enable full features.');
  }
};

module.exports = connectDB;
