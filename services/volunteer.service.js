const volunteerModel = require("../models/volunteer.model");
const activityModel = require("../models/activity.model");

class VolunteerService {
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

  async createVolunteer(volunteerData) {
    const { fullName, email, phone, community, availability, status, isActive, experience } = volunteerData;
    const volunteerSkills = this.toArray(volunteerData.skills);

    if (!email) {
      const err = new Error('Email is required');
      err.status = 400;
      throw err;
    }

    if (volunteerSkills.length === 0) {
      const err = new Error('At least one skill is required');
      err.status = 400;
      throw err;
    }

    const existingVolunteer = await volunteerModel.findOne({ email: typeof email === 'string' ? email.toLowerCase() : email });
    if (existingVolunteer) {
      const err = new Error('A volunteer with this email already exists');
      err.status = 409;
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const volunteer = await volunteerModel.create({
      fullName,
      email,
      phone,
      community,
      skills: volunteerSkills,
      availability,
      experience,
      status,
      isActive: true,
    });

    await activityModel.create({
      type: 'volunteer_applied',
      content: `New volunteer application: ${fullName}`,
      performedBy: fullName,
      relatedId: volunteer._id,
    });

    return volunteer.toJSON();
  }

  async getAllVolunteers(query = {}) {
    const { page = 1, limit = 10, search = '', status } = query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { community: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    const [volunteers, total] = await Promise.all([
      volunteerModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      volunteerModel.countDocuments(filter),
    ]);

    return {
      volunteers: volunteers.map((v) => v.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVolunteerById(id) {
    const volunteer = await volunteerModel.findById(id);
    if (!volunteer) {
      const err = new Error('Volunteer not found');
      err.status = 404;
      throw err;
    }
    return volunteer.toJSON();
  }

  async updateVolunteer(id, updateData) {
    const volunteer = await volunteerModel.findById(id);
    if (!volunteer) {
      const err = new Error('Volunteer not found');
      err.status = 404;
      throw err;
    }

    const { ...rest } = updateData;

    if (rest.email && String(rest.email).toLowerCase() !== volunteer.email) {
      const existing = await volunteerModel.findOne({ email: String(rest.email).toLowerCase() });
      if (existing) {
        const err = new Error('Email already in use');
        err.status = 409;
        throw err;
      }
      rest.email = String(rest.email).toLowerCase();
    }

    if (rest.skills !== undefined) {
      rest.skills = this.toArray(rest.skills);
      if (rest.skills.length === 0) {
        const err = new Error('At least one skill is required');
        err.status = 400;
        throw err;
      }
    }

    Object.assign(volunteer, rest);
    await volunteer.save();
    return volunteer.toJSON();
  }

  async deleteVolunteer(id) {
    const volunteer = await volunteerModel.findByIdAndDelete(id);
    if (!volunteer) {
      const err = new Error('Volunteer not found');
      err.status = 404;
      throw err;
    }
    return { message: 'Volunteer deleted successfully', id: volunteer._id };
  }
}

module.exports = new VolunteerService();
