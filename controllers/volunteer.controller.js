const volunteerService = require("../services/volunteer.service");
const ResponseHandler = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const createVolunteer = asyncHandler(async (req, res) => {
    const result = await volunteerService.createVolunteer(req.body);
    return ResponseHandler.created(res, result, 'Volunteer created successfully');
});

const getAllVolunteers = asyncHandler(async (req, res) => {
    const result = await volunteerService.getAllVolunteers(req.query);
    return ResponseHandler.success(res, result, 'Volunteers retrieved successfully');
});

const getVolunteerById = asyncHandler(async (req, res) => {
    const result = await volunteerService.getVolunteerById(req.params.id);
    return ResponseHandler.success(res, result, 'Volunteer retrieved successfully');
});

const updateVolunteer = asyncHandler(async (req, res) => {
    const result = await volunteerService.updateVolunteer(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'Volunteer updated successfully');
});

const deleteVolunteer = asyncHandler(async (req, res) => {
    const result = await volunteerService.deleteVolunteer(req.params.id);
    return ResponseHandler.success(res, result, 'Volunteer deleted successfully');
});

module.exports = { createVolunteer, getAllVolunteers, getVolunteerById, updateVolunteer, deleteVolunteer };
