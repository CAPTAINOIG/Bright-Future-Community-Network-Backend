const express = require('express')
const { adminLogin } = require('../controllers/admin.controller');

const router = express.Router();

router.post('/adminLogin', adminLogin);

module.exports = router;