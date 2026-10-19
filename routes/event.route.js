const express = require('express');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/events.controller');

const router = express.Router();

router.post('/events', createEvent);
router.get('/events', getAllEvents);
router.get('/events/:id', getEventById);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;
