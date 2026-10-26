const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const connectDB = require('./connection/mongoose.connection');
const logger = require('./utils/logger');

const memberRouter = require('./routes/member.route');
const adminRouter = require('./routes/admin.route');
const dashboardRouter = require('./routes/dashboard.route');
const volunteerRouter = require('./routes/volunteer.route');
const projectRouter = require('./routes/project.route');
const eventRouter = require('./routes/event.route');
const newsRouter = require('./routes/news.route');
const createAdmin = require('./scripts/seedAdmin');
const newsSchedulerService = require('./services/newsScheduler.service');

const app = express();
const server = http.createServer(app);

connectDB()
  .then((connected) => {
    if (connected) {
      return createAdmin().then(() => {
        // Start the automated news collection scheduler
        newsSchedulerService.init();
      });
    }
    return null;
  })
  .catch((err) => logger.error('Startup bootstrap failed:', err));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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
app.use('/api', volunteerRouter);
app.use('/api', projectRouter);
app.use('/api', eventRouter);
app.use('/api', newsRouter);
app.use('/api/auth/', adminRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('Error:', err);

  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let errors = undefined;

  if (err.name === 'ValidationError') {
    status = 400;
    errors = {};
    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });
    message = 'Validation failed';
  }

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate ${field} value. Please use another value.`;
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
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
  newsSchedulerService.stop();
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
