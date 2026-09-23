const memberModel = require("../models/member.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");
const logger = require("../utils/logger");
const emailService = require("./email.service");

class MemberService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );
  }

  async registerMember(userData) {
    const { fullName, phone, location, community, skills, reason, interests, email, password } = userData;
    const existingUser = await memberModel.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await memberModel.create({
      fullName,
      phone,
      location,
      community,
      skills,
      reason,
      interests,
      email,
      password: hashedPassword,
    });
    setImmediate(async () => {
      try {
        await emailService.sendWelcomeEmail(email, fullName);
      } catch (err) {
        logger.error("Welcome email failed (background):", err);
      }
    });
    const token = this.generateToken(user);
    return {
      token,
      user: user.toJSON(),
    };
  }

  async getAllMembers(query = {}) {
    const { page = 1, limit = 10, search = '' } = query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { community: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const [members, total] = await Promise.all([
      memberModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      memberModel.countDocuments(filter),
    ]);

    return {
      members: members.map((m) => m.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMemberById(id) {
    const member = await memberModel.findById(id);
    if (!member) {
      throw new Error('Member not found');
    }
    return member.toJSON();
  }

  async updateMember(id, updateData) {
    const member = await memberModel.findById(id);
    if (!member) {
      throw new Error('Member not found');
    }

    const { fullName, phone, location, community, skills, reason, interests, email } = updateData;

    if (email && email.toLowerCase() !== member.email) {
      const existing = await memberModel.findOne({ email: email.toLowerCase() });
      if (existing) {
        throw new Error('Email already in use');
      }
      member.email = email.toLowerCase();
    }

    // if (password) {
    //   rest.password = await bcrypt.hash(password, 10);
    // }

    // Object.assign(member, rest);
    // await member.save();
    // return member.toJSON();
  }

  async deleteMember(id) {
    const member = await memberModel.findByIdAndDelete(id);
    if (!member) {
      throw new Error('Member not found');
    }
    return { message: 'Member deleted successfully', id: member._id };
  }
}

module.exports = new MemberService();