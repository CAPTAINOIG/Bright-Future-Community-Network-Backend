const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
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
} = require('../controllers/news.controller');

const router = express.Router();

// ──────────────────────────────────────────────
//  ADMIN ROUTES (must be defined before :slug)
//  All admin routes require authentication + admin role
// ──────────────────────────────────────────────

router.get('/news/admin/stats', authenticate,authorize('admin', 'superadmin'),getNewsStats);

router.post(
  '/news/admin/fetch',
  authenticate,
  authorize('admin', 'superadmin'),
  triggerManualFetch,
);

// Source management
router.get(
  '/news/admin/sources',
  authenticate,
  authorize('admin', 'superadmin'),
  getSources,
);

router.post(
  '/news/admin/sources',
  authenticate,
  authorize('admin', 'superadmin'),
  createSource,
);

router.get(
  '/news/admin/sources/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  getSourceById,
);

router.patch(
  '/news/admin/sources/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  updateSource,
);

router.delete(
  '/news/admin/sources/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  deleteSource,
);

// Article management
router.get(
  '/news/admin',
  authenticate,
  authorize('admin', 'superadmin'),
  getAdminNews,
);

router.get(
  '/news/admin/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  getAdminNewsById,
);

router.patch(
  '/news/admin/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  updateAdminNews,
);

// ──────────────────────────────────────────────
//  PUBLIC ROUTES
// ──────────────────────────────────────────────

router.get('/news', getPublishedNews);
router.get('/news/:slug', getPublishedNewsBySlug);

// ──────────────────────────────────────────────
//  LEGACY ROUTES (preserved for backwards compat)
// ──────────────────────────────────────────────

router.post('/news', createNews);
router.put('/news/:id', updateNews);
router.delete('/news/:id', deleteNews);

module.exports = router;
