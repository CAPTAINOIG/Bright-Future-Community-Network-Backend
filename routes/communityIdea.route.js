const express = require('express');

const { createCommunityIdea, getCommunityIdeaById, getCommunityIdea, updateCommunityIdea, deleteCommunityIdea } = require('../controllers/communityideas.controller');

const router = express.Router();
router.get('/communityIdea', getCommunityIdea);
router.get('/communityIdea/:id', getCommunityIdeaById);
router.post('/communityIdea', createCommunityIdea);
router.put('/communityIdea/:id', updateCommunityIdea);
router.delete('/communityIdea/:id', deleteCommunityIdea);

module.exports = router;
