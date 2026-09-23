const express = require('express');
const {
  registerMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
} = require('../controllers/member.controller');

const router = express.Router();

router.post('/members/register', registerMember);
router.get('/members', getAllMembers);
router.get('/members/:id', getMemberById);
router.put('/members/:id', updateMember);
router.delete('/members/:id', deleteMember);

module.exports = router;
