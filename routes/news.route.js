const express = require('express');
const {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
} = require('../controllers/news.controller');

const router = express.Router();

router.post('/news', createNews);
router.get('/news', getAllNews);
router.get('/news/:id', getNewsById);
router.put('/news/:id', updateNews);
router.delete('/news/:id', deleteNews);

module.exports = router;
