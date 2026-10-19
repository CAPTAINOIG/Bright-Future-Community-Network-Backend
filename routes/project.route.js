const express = require('express');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/projects.controller');

const router = express.Router();

router.post('/projects', createProject);
router.get('/projects', getAllProjects);
router.get('/projects/:id', getProjectById);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

module.exports = router;
