const memberModel = require("../models/member.model");
const activityModel = require("../models/activity.model");
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

  toArray(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string' && v.trim().length > 0);
    if (typeof value === 'string') {
      return value
        .split(/[,;\n|]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  async registerMember(userData) {
    const { fullName, phone, location, community, reason, email, skill, interests, isActive } = userData;
    const memberInterests = this.toArray(interests);
    if (!email) {
      const err = new Error('Email is required');
      err.status = 400;
      throw err;
    }
    if (memberInterests.length === 0) {
      const err = new Error('At least one interest is required');
      err.status = 400;
      throw err;
    }
    const existingUser = await memberModel.findOne({ email: typeof email === 'string' ? email.toLowerCase() : email });
    if (existingUser) {
      const err = new Error('A member with this email already exists');
      err.status = 409;
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }
    const user = await memberModel.create({
      fullName,
      phone,
      location,
      community,
      interests: memberInterests,
      reason,
      skill,
      email,
      isActive: true,
    });
    await activityModel.create({
      type: 'member_registered',
      content: `New member registered: ${fullName}`,
      performedBy: fullName,
      relatedId: user._id,
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
  const {
    page = 1,
    limit = 10,
    search = '',
    isActive,
    interests,
    community,
  } = query;

  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Number(limit) || 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = {};

  if (search.trim()) {
    filter.$or = [
      { fullName: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
      { community: { $regex: search.trim(), $options: 'i' } },
      { location: { $regex: search.trim(), $options: 'i' } },
    ];
  }
  // Convert query string to a real Boolean
  if (isActive === 'true' || isActive === true) {
    filter.isActive = true;
  } else if (isActive === 'false' || isActive === false) {
    filter.isActive = false;
  }
  if (community) {
  filter.community = community;
}
if (interests) {
  filter.interests = { $in: this.toArray(interests) };
}

  const [members, total] = await Promise.all([
    memberModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),

    memberModel.countDocuments(filter),
  ]);

  return {
    members,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

  async getMemberById(id) {
    const member = await memberModel.findById(id);
    if (!member) {
      const err = new Error('Member not found');
      err.status = 404;
      throw err;
    }
    return member.toJSON();
  }

  async updateMember(id, updateData) {
    const member = await memberModel.findById(id);
    if (!member) {
      const err = new Error('Member not found');
      err.status = 404;
      throw err;
    }

    const {...rest } = updateData;

    if (rest.email && String(rest.email).toLowerCase() !== member.email) {
      const existing = await memberModel.findOne({ email: String(rest.email).toLowerCase() });
      if (existing) {
        const err = new Error('Email already in use');
        err.status = 409;
        throw err;
      }
      rest.email = String(rest.email).toLowerCase();
    }

    if (rest.interests !== undefined) {
      rest.interests = this.toArray(rest.interests);
      if (rest.interests.length === 0) {
        const err = new Error('At least one interest is required');
        err.status = 400;
        throw err;
      }
    }

    Object.assign(member, rest);
    await member.save();
    return member.toJSON();
  }

  async deleteMember(id) {
    const member = await memberModel.findByIdAndDelete(id);
    if (!member) {
      const err = new Error('Member not found');
      err.status = 404;
      throw err;
    }
    return { message: 'Member deleted successfully', id: member._id };
  }
}

module.exports = new MemberService();