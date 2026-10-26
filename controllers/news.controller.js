const newsService = require('../services/news.service');
const newsSchedulerService = require('../services/newsScheduler.service');
const ResponseHandler = require('../utils/responseHandler');
const asyncHandler = require('../utils/asyncHandler');

// ──────────────────────────────────────────────
//  PUBLIC ENDPOINTS
// ──────────────────────────────────────────────

/**
 * GET /api/news — Published articles (public)
 */
const getPublishedNews = asyncHandler(async (req, res) => {
  const result = await newsService.getPublishedNews(req.query);
  return ResponseHandler.success(res, result, 'News retrieved successfully');
});

/**
 * GET /api/news/:slug — Single published article by slug (public)
 */
const getPublishedNewsBySlug = asyncHandler(async (req, res) => {
  const result = await newsService.getPublishedNewsBySlug(req.params.slug);
  return ResponseHandler.success(res, result, 'Article retrieved successfully');
});

// ──────────────────────────────────────────────
//  ADMIN ENDPOINTS
// ──────────────────────────────────────────────

/**
 * GET /api/news/admin — List all articles with filters (admin only)
 */
const getAdminNews = asyncHandler(async (req, res) => {
  const result = await newsService.getAdminNews(req.query);
  return ResponseHandler.success(res, result, 'Admin news retrieved successfully');
});

/**
 * GET /api/news/admin/:id — Get article by ID for review (admin only)
 */
const getAdminNewsById = asyncHandler(async (req, res) => {
  const result = await newsService.getAdminNewsById(req.params.id);
  return ResponseHandler.success(res, result, 'Article retrieved successfully');
});

/**
 * PATCH /api/news/admin/:id — Update article status/category/featured (admin only)
 */
const updateAdminNews = asyncHandler(async (req, res) => {
  const result = await newsService.updateAdminNews(req.params.id, req.body);
  return ResponseHandler.success(res, result, 'Article updated successfully');
});

/**
 * POST /api/news/admin/fetch — Trigger manual collection (admin only)
 */
const triggerManualFetch = asyncHandler(async (req, res) => {
  const result = await newsSchedulerService.triggerManualFetch();
  return ResponseHandler.success(res, result, 'Manual fetch completed');
});

/**
 * GET /api/news/admin/stats — News statistics (admin only)
 */
const getNewsStats = asyncHandler(async (req, res) => {
  const result = await newsService.getNewsStats();
  return ResponseHandler.success(res, result, 'News stats retrieved successfully');
});

// ──────────────────────────────────────────────
//  ADMIN SOURCE MANAGEMENT ENDPOINTS
// ──────────────────────────────────────────────

/**
 * GET /api/news/admin/sources — List all news sources (admin only)
 */
const getSources = asyncHandler(async (req, res) => {
  const result = await newsService.getSources();
  return ResponseHandler.success(res, result, 'Sources retrieved successfully');
});

/**
 * GET /api/news/admin/sources/:id — Get source by ID (admin only)
 */
const getSourceById = asyncHandler(async (req, res) => {
  const result = await newsService.getSourceById(req.params.id);
  return ResponseHandler.success(res, result, 'Source retrieved successfully');
});

/**
 * POST /api/news/admin/sources — Create a news source (admin only)
 */
const createSource = asyncHandler(async (req, res) => {
  const result = await newsService.createSource(req.body);
  return ResponseHandler.created(res, result, 'Source created successfully');
});

/**
 * PATCH /api/news/admin/sources/:id — Update a news source (admin only)
 */
const updateSource = asyncHandler(async (req, res) => {
  const result = await newsService.updateSource(req.params.id, req.body);
  return ResponseHandler.success(res, result, 'Source updated successfully');
});

/**
 * DELETE /api/news/admin/sources/:id — Delete a news source (admin only)
 */
const deleteSource = asyncHandler(async (req, res) => {
  const result = await newsService.deleteSource(req.params.id);
  return ResponseHandler.success(res, result, 'Source deleted successfully');
});

// ──────────────────────────────────────────────
//  LEGACY ENDPOINTS (preserved for backwards compat)
// ──────────────────────────────────────────────

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

module.exports = {
  // Public
  getPublishedNews,
  getPublishedNewsBySlug,
  // Admin
  getAdminNews,
  getAdminNewsById,
  updateAdminNews,
  triggerManualFetch,
  getNewsStats,
  // Source management
  getSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
  // Legacy
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
};
