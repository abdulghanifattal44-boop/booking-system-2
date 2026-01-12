const express = require('express');
const router = express.Router();
const stripeWebhookHandler = require('../controllers/webhooksController').stripeWebhookHandler;

// For Stripe we must use raw body; in index.js mount this router with express.raw used for this route only.
router.post('/stripe', stripeWebhookHandler);

module.exports = router;
