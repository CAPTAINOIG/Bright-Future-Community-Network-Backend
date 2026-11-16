const CommunityIdeaService = require("../services/CommunityIdeas.service");
const asyncHandler = require("../utils/asyncHandler");
const ResponseHandler = require("../utils/responseHandler");


const createCommunityIdea = asyncHandler(async (req, res) => {
    const result = await CommunityIdeaService.createCommunityIdea(req.body);
    return ResponseHandler.success(res, result, 'Community Idea Created Successfully');
})

const getCommunityIdea = asyncHandler(async (req, res) => {
    const result = await CommunityIdeaService.getCommunityIdea(req.query);
    return ResponseHandler.success(res, result, 'Community Idea Fetched Successfully');
})

const getCommunityIdeaById = asyncHandler(async (req, res) => {
    const result = await CommunityIdeaService.getCommunityIdeaById(req.params.id);
    return ResponseHandler.success(res, result, 'Community Idea Fetched Successfully');
})

const updateCommunityIdea = asyncHandler(async (req, res) => {
    const result = await CommunityIdeaService.updateCommunityIdea(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'Community Idea Updated Successfully');
})

const deleteCommunityIdea = asyncHandler(async (req, res) => {  
    const result = await CommunityIdeaService.deleteCommunityIdea(req.params.id);
    return ResponseHandler.success(res, result, 'Community Idea Deleted Successfully');
})

module.exports = { createCommunityIdea, getCommunityIdeaById, getCommunityIdea, updateCommunityIdea, deleteCommunityIdea }
