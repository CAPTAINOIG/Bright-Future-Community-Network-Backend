const express = require('express');
const {
  createVolunteer,
  getAllVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
} = require('../controllers/volunteer.controller');

const router = express.Router();

router.post('/volunteers', createVolunteer);
router.get('/volunteers', getAllVolunteers);
router.get('/volunteers/:id', getVolunteerById);
router.put('/volunteers/:id', updateVolunteer);
router.delete('/volunteers/:id', deleteVolunteer);

module.exports = router;
