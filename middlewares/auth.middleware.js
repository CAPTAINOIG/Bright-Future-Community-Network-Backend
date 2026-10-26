const jwt = require('jsonwebtoken');
const config = require('../config');
const adminModel = require('../models/admin.model');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Verify JWT token and attach admin user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.unauthorized(res, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return ResponseHandler.unauthorized(res, 'Access denied. No token provided.');
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const admin = await adminModel.findById(decoded.id).select('-password');

    if (!admin) {
      return ResponseHandler.unauthorized(res, 'Invalid token. Admin not found.');
    }

    if (!admin.isActive) {
      return ResponseHandler.forbidden(res, 'Admin account is inactive.');
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler.unauthorized(res, 'Invalid token.');
    }
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler.unauthorized(res, 'Token expired.');
    }
    logger.error('Auth middleware error:', error);
    return ResponseHandler.serverError(res, 'Authentication failed.');
  }
};

/**
 * Check that the authenticated admin has the required role
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'superadmin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return ResponseHandler.unauthorized(res, 'Authentication required.');
    }

    if (!roles.includes(req.admin.role)) {
      return ResponseHandler.forbidden(res, 'You do not have permission to perform this action.');
    }

    next();
  };
};

module.exports = { authenticate, authorize };
