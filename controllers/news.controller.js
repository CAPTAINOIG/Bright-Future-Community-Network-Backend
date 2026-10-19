const newsService = require("../services/news.service");
const ResponseHandler = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");

const createNews = asyncHandler(async (req, res) => {
    const result = await newsService.createNews(req.body);
    return ResponseHandler.created(res, result, 'News created successfully');
});

const getAllNews = asyncHandler(async (req, res) => {
    const result = await newsService.getAllNews(req.query);
    return ResponseHandler.success(res, result, 'News retrieved successfully');
});

const getNewsById = asyncHandler(async (req, res) => {
    const result = await newsService.getNewsById(req.params.id);
    return ResponseHandler.success(res, result, 'News retrieved successfully');
});

const updateNews = asyncHandler(async (req, res) => {
    const result = await newsService.updateNews(req.params.id, req.body);
    return ResponseHandler.success(res, result, 'News updated successfully');
});

const deleteNews = asyncHandler(async (req, res) => {
    const result = await newsService.deleteNews(req.params.id);
    return ResponseHandler.success(res, result, 'News deleted successfully');
});

module.exports = { createNews, getAllNews, getNewsById, updateNews, deleteNews };
