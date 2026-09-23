const memberService = require("../services/member.service");
const ResponseHandler = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const registerMember = asyncHandler(async (req, res) => {
    const result = await memberService.registerMember(req.body);
    return ResponseHandler.created(res, result, 'Member registered successfully');
});

const getAllMembers = asyncHandler(async (req, res) => {
    const result = await memberService.getAllMembers(req.query);
    return ResponseHandler.success(res, result, 'Members retrieved successfully');
});

const getMemberById = asyncHandler(async (req, res) => {
    const result = await memberService.getMemberById(req.params.id);
    return ResponseHandler.success(res, result, 'Member retrieved successfully');
});

const updateMember = asyncHandler(async (req, res) => {
    const result = await memberService.updateMember(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'Member updated successfully');
});

const deleteMember = asyncHandler(async (req, res) => {
    const result = await memberService.deleteMember(req.params.id);
    return ResponseHandler.success(res, result, 'Member deleted successfully');
});

module.exports = { registerMember, getAllMembers, getMemberById, updateMember, deleteMember };
