const projectService = require("../services/projects.service");
const ResponseHandler = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const createProject = asyncHandler(async (req, res) => {
    const result = await projectService.createProject(req.body);
    return ResponseHandler.created(res, result, 'Project created successfully');
});

const getAllProjects = asyncHandler(async (req, res) => {
    const result = await projectService.getAllProjects(req.query);
    return ResponseHandler.success(res, result, 'Projects retrieved successfully');
});

const getProjectById = asyncHandler(async (req, res) => {
    const result = await projectService.getProjectById(req.params.id);
    return ResponseHandler.success(res, result, 'Project retrieved successfully');
});

const updateProject = asyncHandler(async (req, res) => {
    const result = await projectService.updateProject(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'Project updated successfully');
});

const deleteProject = asyncHandler(async (req, res) => {
    const result = await projectService.deleteProject(req.params.id);
    return ResponseHandler.success(res, result, 'Project deleted successfully');
});

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject };
