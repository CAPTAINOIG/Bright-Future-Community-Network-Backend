const express = require('express');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/event.controller');

const router = express.Router();

router.post('/event', createEvent);
router.get('/event', getAllEvents);
router.get('/event/:id', getEventById);
router.put('/event/:id', updateEvent);
router.delete('/event/:id', deleteEvent);

module.exports = router;
