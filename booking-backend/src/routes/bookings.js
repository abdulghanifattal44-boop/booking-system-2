const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createBooking } = require('../controllers/bookingsController');

router.post('/', auth, createBooking);

// add GET /, GET /:id /cancel etc.

module.exports = router;
