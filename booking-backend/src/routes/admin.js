const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/stats', auth, adminController.getStats);

module.exports = router;
