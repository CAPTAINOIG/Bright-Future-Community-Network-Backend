const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const connectDB = require('./connection/mongoose.connection');
const logger = require('./utils/logger');

const memberRouter = require('./routes/member.route');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: config.cors.credentials,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BFCN Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

app.use('/api', memberRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const missing = [];
if (!config.mongodb.uri) missing.push('MONGODB_URI');
if (!config.jwt.secret) missing.push('JWT_SECRET');
if (missing.length) {
  logger.warn(`Missing environment variables: ${missing.join(', ')}`);
  console.warn(`⚠️  Missing env vars: ${missing.join(', ')} — add them in Render Environment Variables.`);
} else {
  logger.info('All required environment variables are set');
}

const HOST = config.nodeEnv === 'production' ? '0.0.0.0' : 'localhost';
server.listen(config.port, HOST, () => {
  logger.info(`Server running on ${HOST}:${config.port} in ${config.nodeEnv} mode`);
  console.log(`🚀 Server running on http://${HOST}:${config.port}`);
  console.log(`🌐 Health check: http://${HOST}:${config.port}/health`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('Uncaught Exception:', error);
});

process.on('warning', (warning) => {
  logger.warn('Node.js Warning:', warning);
});

module.exports = { app, server };
