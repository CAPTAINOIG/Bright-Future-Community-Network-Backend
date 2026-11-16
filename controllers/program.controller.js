const programService = require("../services/program.service");
const ResponseHandler = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const createProgram = asyncHandler(async (req, res) => {
    const result = await programService.createProgram(req.body);
    return ResponseHandler.created(res, result, 'Programme created successfully');
});

const getAllProgram = asyncHandler(async (req, res) => {
    const result = await programService.getAllProgram(req.query);
    return ResponseHandler.success(res, result, 'Programmes retrieved successfully');
});

const getProgramById = asyncHandler(async (req, res) => {
    const result = await programService.getProgramById(req.params.id);
    return ResponseHandler.success(res, result, 'Programme retrieved successfully');
});

const updateProgram = asyncHandler(async (req, res) => {
    const result = await programService.updateProgram(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'Programme updated successfully');
});

const deleteProgram = asyncHandler(async (req, res) => {
    const result = await programService.deleteProgram(req.params.id);
    return ResponseHandler.success(res, result, 'Programme deleted successfully');
});

module.exports = { createProgram, getAllProgram, getProgramById, updateProgram, deleteProgram };
