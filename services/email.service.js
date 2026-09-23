const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = !!(config.email.user && config.email.password);
    
    if (this.isConfigured) {
      try {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: config.email.user,
            pass: config.email.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        logger.info('Email service initialized successfully');
      } catch (error) {
        logger.warn('Email service failed to initialize:', error.message);
        this.isConfigured = false;
      }
    } else {
      logger.warn('Email service not configured (missing EMAIL_USER or EMAIL_PASSWORD)');
    }
  }

  async sendWelcomeEmail(email, username) {
    if (!this.isConfigured || !this.transporter) {
      logger.info(`Skipping welcome email to ${email} - email service not configured`);
      return;
    }
    
    const Captain = "https://res.cloudinary.com/dbp6ovv7b/image/upload/v1715783819/tvf5apwj5bwmwf2qjfhh.png";
    
    const mailOptions = {
      from: config.email.user,
      to: email,
      subject: "Welcome to Captain Track",
      html: `
        <div style="background-color: rgb(4,48,64); padding: 20px; color: rgb(179,148,113); border-radius: 5px">
          <img src="${Captain}" alt="Captain Track Logo" style="max-width: 150px; height: 130px; margin-bottom: 20px; margin-left: 300px;">
          <div style="text-align: center;">
            <p style="font-size: 18px;">Hello, ${username}!</p>
            <p style="font-size: 16px;">Welcome to Captain Track! We're thrilled that you've chosen to register with us.</p>
            <p style="font-size: 16px;">If you have any questions or need assistance, feel free to reach out.</p>
            <p style="font-size: 16px;">Thank you for joining us.</p>
            <p style="font-size: 16px;">Best regards,</p>
            <p style="font-size: 16px;">The Captain Track Team</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send welcome email to ${email}:`, error);
    }
  }

}

module.exports = new EmailService();
