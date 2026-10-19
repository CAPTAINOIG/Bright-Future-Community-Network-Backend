const eventService = require("../services/events.service");
const ResponseHandler = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const createEvent = asyncHandler(async (req, res) => {
    const result = await eventService.createEvent(req.body);
    return ResponseHandler.created(res, result, 'Event created successfully');
});

const getAllEvents = asyncHandler(async (req, res) => {
    const result = await eventService.getAllEvents(req.query);
    return ResponseHandler.success(res, result, 'Events retrieved successfully');
});

const getEventById = asyncHandler(async (req, res) => {
    const result = await eventService.getEventById(req.params.id);
    return ResponseHandler.success(res, result, 'Event retrieved successfully');
});

const updateEvent = asyncHandler(async (req, res) => {
    const result = await eventService.updateEvent(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'Event updated successfully');
});

const deleteEvent = asyncHandler(async (req, res) => {
    const result = await eventService.deleteEvent(req.params.id);
    return ResponseHandler.success(res, result, 'Event deleted successfully');
});

module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent };
