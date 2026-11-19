const express = require('express');

const { getAllProgram, getProgramById, createProgram, updateProgram, deleteProgram } = require('../controllers/program.controller');
const { registerForProgram, getUserProgramRegistrations, updateAttendance, getAllProgramParticipant } = require('../controllers/programRegistration.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
router.post('/program/:id/registrations', registerForProgram);
router.get('/program/:id/registrations', authenticate, getUserProgramRegistrations);
router.patch('/program/registrations/:registrationId/attendance', authenticate, updateAttendance);
router.get('/program/registrations/participants', getAllProgramParticipant);
router.get('/program', getAllProgram);
router.get('/program/:id', getProgramById);
router.post('/program', createProgram);
router.put('/program/:id', updateProgram);
router.delete('/program/:id', deleteProgram);

module.exports = router;