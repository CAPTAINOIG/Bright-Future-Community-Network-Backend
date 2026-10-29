const bcrypt = require("bcrypt");
const config = require("../config");
const adminModel = require("../models/admin.model");
const connectDB = require("../connection/mongoose.connection");
const logger = require("../utils/logger");

const createAdmin = async () => {
  try {
    if (!config.adminLogin.email || !config.adminLogin.password) {
      logger.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed");
      console.warn("⚠️  ADMIN_EMAIL or ADMIN_PASSWORD missing from env vars — admin not seeded");
      return null;
    }

    const existingAdmin = await adminModel.findOne({
      email: config.adminLogin.email.toLowerCase(),
    });
    if (existingAdmin) {
      // ADMIN_PASSWORD is the source of truth — sync it if it was changed in env vars
      const passwordMatches = await bcrypt.compare(config.adminLogin.password, existingAdmin.password);
      if (!passwordMatches) {
        existingAdmin.password = await bcrypt.hash(config.adminLogin.password, 10);
        await existingAdmin.save();
        logger.info(`Admin password updated from ADMIN_PASSWORD: ${existingAdmin.email}`);
        console.log(`🔑 Admin password updated for ${existingAdmin.email}`);
      } else {
        logger.info(`Admin already seeded: ${existingAdmin.email}`);
      }
      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash(config.adminLogin.password, 10);
    const admin = await adminModel.create({
      email: config.adminLogin.email.toLowerCase(),
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
    });
    logger.info(`Admin seeded successfully: ${admin.email} (role: ${admin.role})`);
    console.log(`✅ Admin created: ${admin.email}  (role: ${admin.role})`);
    return admin;
  } catch (error) {
    if (error.code === 11000) {
      console.log("ℹ️  Admin already exists (duplicate key).");
      return null;
    }
    logger.error("Failed to seed admin:", error);
    console.error("❌ Failed to create admin:", error.message);
    return null;
  }
};

if (require.main === module) {
  (async () => {
    await connectDB();
    await new Promise((r) => setTimeout(r, 3000));
    await createAdmin();
    process.exit(0);
  })();
}

module.exports = createAdmin;