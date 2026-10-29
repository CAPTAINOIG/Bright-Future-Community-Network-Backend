const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bfcn-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console logging everywhere — Render only shows stdout/stderr, not log files
logger.add(new winston.transports.Console({
  format: config.nodeEnv === 'production'
    ? winston.format.combine(winston.format.timestamp(), winston.format.simple())
    : winston.format.combine(winston.format.colorize(), winston.format.simple()),
}));

module.exports = logger;
