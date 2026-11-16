const registrationService = require('../services/programRegistration.service');
const ResponseHandler = require('../utils/responseHandler');
const asyncHandler = require('../utils/asyncHandler');

const registerForProgram = asyncHandler(async (req, res) => {
  const result = await registrationService.register(req.params.id, req.body);
  return ResponseHandler.created(res, result, 'Programme registration received');
});

const getProgramRegistrations = asyncHandler(async (req, res) => {
  const result = await registrationService.getByProgram(req.params.id);
  return ResponseHandler.success(res, result, 'Programme registrations retrieved successfully');
});

const updateAttendance = asyncHandler(async (req, res) => {
  const result = await registrationService.setAttendance(req.params.registrationId, req.body.attended);
  return ResponseHandler.success(res, result, 'Attendance updated successfully');
});

module.exports = { registerForProgram, getProgramRegistrations, updateAttendance };
