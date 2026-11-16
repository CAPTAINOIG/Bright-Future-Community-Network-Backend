const programModel = require("../models/program.model");
const activityModel = require("../models/activity.model");
const programRegistrationModel = require("../models/programRegistration.model");

class ProgramService {
  async createProgram(programData) {
    const {
      title,
      description,
      location,
      objective,
      startDate,
      endDate,
      participant,
      beneficiary,
      duration,
      coordinator,
      programmeType,
      registrationFee,
      status,
    } = programData;

    if (
      !title ||
      !description ||
      !location ||
      !startDate ||
      !endDate ||
      participant === undefined ||
      participant === null ||
      participant === '' ||
      !beneficiary ||
      !programmeType ||
      registrationFee === undefined ||
      registrationFee === null ||
      registrationFee === ''
    ) {
      const err = new Error("All fields are required");
      err.status = 400;
      throw err;
    }

    const program = await programModel.create({
      title,
      description,
      location,
      objective,
      startDate,
      endDate,
      participant,
      beneficiary,
      duration,
      coordinator,
      programmeType,
      registrationFee,
      status,
    });

    await activityModel.create({
      type: "program_created",
      content: `New program: ${title}`,
      performedBy: title,
      relatedId: program._id,
    });

    return program.toJSON();
  }

  async getAllProgram(query = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      location,
      programmeType,
      coordinator,
      participant,
    } = query;
    const skip = (page - 1) * limit;
    const filter = {};

    if (String(search).trim()) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { coordinator: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      filter.status = status;
    }
    if (location) {
      filter.location = location;
    }
    if (programmeType) {
      filter.programmeType = programmeType;
    }
    if (coordinator) {
      filter.coordinator = coordinator;
    }
    if (participant) {
      filter.participant = participant;
    }

    const [programs, total] = await Promise.all([
      programModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      programModel.countDocuments(filter),
    ]);

    return {
      programmes: programs.map((p) => p.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProgramById(id) {
    const program = await programModel.findById(id);
    if (!program) {
      const err = new Error("Program not found");
      err.status = 404;
      throw err;
    }
    return program.toJSON();
  }

  async updateProgram(id, programData) {
    const program = await programModel.findByIdAndUpdate(id, programData, {
      new: true,
      runValidators: true,
    });
    if (!program) {
      const err = new Error("Program not found");
      err.status = 404;
      throw err;
    }
    return program.toJSON();
  }

  async deleteProgram(id) {
    const program = await programModel.findByIdAndDelete(id);
    if (!program) {
      const err = new Error("Program not found");
      err.status = 404;
      throw err;
    }
    await programRegistrationModel.deleteMany({ program: id });
    return { message: 'Program deleted successfully', id };
  }
}

module.exports = new ProgramService();
