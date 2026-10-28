const config = require("../config");
const adminModel = require("../models/admin.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

class AdminService {
  generateToken(admin) {
    return jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );
  }

  async adminLogin(email, password) {
    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.status = 400;
      throw error;
    }

    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : email;
    
    // Add timeout wrapper for database query
    let admin;
    try {
      const query = adminModel.findOne({ email: normalizedEmail });
      admin = await Promise.race([
        query.exec(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 8000)
        )
      ]);
    } catch (err) {
      logger.error('Failed to fetch admin from database:', err.message);
      const error = new Error('Database connection issue - please try again');
      error.status = 503;
      throw error;
    }

    if (!admin) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    if (!admin.isActive) {
      const error = new Error("Admin account is inactive");
      error.status = 403;
      throw error;
    }

    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(String(password), admin.password);
    } catch (err) {
      logger.error("bcrypt compare failed for admin:", err.message);
      const error = new Error("Authentication service error");
      error.status = 500;
      throw error;
    }

    if (!validPassword) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    const token = this.generateToken(admin);

    return {
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    };
  }
}

module.exports = new AdminService();