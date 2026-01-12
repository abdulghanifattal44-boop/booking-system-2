const stripe = require('stripe')(process.env.STRIPE_SECRET);
const pool = require('../db/pool');

async function stripeWebhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // if no endpoint secret, parse body (not recommended)
      event = req.body;
    }
  } catch (err) {
    console.error('stripe webhook signature failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        // find payment by provider_ref = payment_intent id
        await pool.query(
          `UPDATE booking.payments SET status = 'paid', amount_paid = $1, provider_ref = $2, updated_at = now()
           WHERE provider_ref = $2 OR provider_ref IS NULL AND booking_id = (SELECT id FROM booking.payments WHERE provider_ref = $2 LIMIT 1)`,
          [pi.amount_received / 100.0, pi.id]
        );
        // Optionally mark booking as paid / trigger notifications
        // find booking id and mark something, or create notification
        break;
      }
      case 'charge.refunded':
      case 'charge.refund.updated': {
        // handle refunds if you create refund events
        const charge = event.data.object;
        // update payments status -> refunded
        await pool.query(
          `UPDATE booking.payments SET status = 'refunded', provider_ref = $1, updated_at = now() WHERE provider_ref = $1`,
          [charge.id]
        );
        break;
      }
      default:
        // ignore other events
    }

    res.json({ received: true });
  } catch (err) {
    console.error('stripe webhook processing error', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = { stripeWebhookHandler };
