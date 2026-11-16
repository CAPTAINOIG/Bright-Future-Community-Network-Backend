const mongoose = require('mongoose');
const programModel = require('../models/program.model');
const registrationModel = require('../models/programRegistration.model');

class ProgramRegistrationService {
  async register(programId, registrationData) {
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      const err = new Error('Invalid programme ID');
      err.status = 400;
      throw err;
    }

    const program = await programModel.findById(programId);
    if (!program) {
      const err = new Error('Programme not found');
      err.status = 404;
      throw err;
    }

    if (!['Pending', 'Ongoing'].includes(program.status)) {
      const err = new Error('Registration is closed for this programme');
      err.status = 400;
      throw err;
    }
    if (new Date(program.endDate).toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10)) {
      const err = new Error('Registration is closed for this programme');
      err.status = 400;
      throw err;
    }

    const { fullName, email, phone, community, consent } = registrationData;
    if (
      typeof fullName !== 'string' ||
      !fullName.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof phone !== 'string' ||
      !phone.trim() ||
      typeof community !== 'string' ||
      !community.trim() ||
      consent !== true
    ) {
      const err = new Error('Please provide all required details and consent to be contacted');
      err.status = 400;
      throw err;
    }

    return registrationModel.create({
      program: programId,
      fullName,
      email,
      phone,
      community,
      consentAt: new Date(),
    });
  }

  async getByProgram(programId) {
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      const err = new Error('Invalid programme ID');
      err.status = 400;
      throw err;
    }

    const program = await programModel.findById(programId);
    if (!program) {
      const err = new Error('Programme not found');
      err.status = 404;
      throw err;
    }

    const registrations = await registrationModel.find({ program: programId }).sort({ createdAt: -1 });
    const attended = registrations.filter((registration) => registration.attended).length;

    return {
      registrations: registrations.map((registration) => registration.toJSON()),
      counts: {
        registered: registrations.length,
        attended,
      },
    };
  }

  async setAttendance(registrationId, attended) {
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      const err = new Error('Invalid registration ID');
      err.status = 400;
      throw err;
    }

    if (typeof attended !== 'boolean') {
      const err = new Error('Attendance must be true or false');
      err.status = 400;
      throw err;
    }

    const registration = await registrationModel.findByIdAndUpdate(
      registrationId,
      { attended },
      { new: true, runValidators: true },
    );
    if (!registration) {
      const err = new Error('Registration not found');
      err.status = 404;
      throw err;
    }

    return registration.toJSON();
  }
}

module.exports = new ProgramRegistrationService();
