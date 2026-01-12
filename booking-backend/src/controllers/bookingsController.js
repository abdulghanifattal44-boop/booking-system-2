const pool = require('../db/pool');

/**
 * Body: { user_email, resource_name, start_time, end_time, guest_count, special_requests, policy_name }
 * Times are ISO strings with timezone (timestamptz)
 */
async function createBooking(req, res) {
  const { user_email, resource_name, start_time, end_time, guest_count = 1, special_requests = null, policy_name = null } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) find user
    const uQ = `SELECT id FROM booking.users WHERE email = $1 LIMIT 1`;
    const uRes = await client.query(uQ, [user_email]);
    if (!uRes.rows[0]) throw { status: 400, message: 'User not found' };
    const userId = uRes.rows[0].id;

    // 2) find resource
    const rQ = `SELECT id FROM booking.resources WHERE name = $1 LIMIT 1`;
    const rRes = await client.query(rQ, [resource_name]);
    if (!rRes.rows[0]) throw { status: 400, message: 'Resource not found' };
    const resourceId = rRes.rows[0].id;

    // 3) find exact timeslot and lock it (use FOR UPDATE to avoid race)
    const tsQ = `
      SELECT id, status, available_capacity
      FROM booking.timeslots
      WHERE resource_id = $1
        AND start_at = $2::timestamptz
        AND end_at = $3::timestamptz
      FOR UPDATE
    `;
    const tsRes = await client.query(tsQ, [resourceId, start_time, end_time]);
    if (!tsRes.rows[0]) throw { status: 409, message: 'Timeslot not found or not available' };
    const timeslot = tsRes.rows[0];
    if (timeslot.status !== 'open') throw { status: 409, message: 'Timeslot not open' };
    if (timeslot.available_capacity <= 0) throw { status: 409, message: 'No capacity' };

    // 4) ensure no active booking already for this timeslot (unique partial index should protect,
    // but we double-check to return friendly error)
    const checkQ = `
      SELECT 1 FROM booking.bookings
      WHERE timeslot_id = $1
        AND status IN ('pending','confirmed')
      LIMIT 1
      FOR SHARE
    `;
    const chk = await client.query(checkQ, [timeslot.id]);
    if (chk.rowCount > 0) throw { status: 409, message: 'Timeslot already booked' };

    // 5) find policy id (optional)
    let policyId = null;
    if (policy_name) {
      const p = await client.query('SELECT id FROM booking.cancellation_policies WHERE name = $1 LIMIT 1', [policy_name]);
      if (p.rows[0]) policyId = p.rows[0].id;
    }

    // 6) insert booking
    const insertBookingQ = `
      INSERT INTO booking.bookings (user_id, resource_id, timeslot_id, policy_id, status, guest_count, special_requests)
      VALUES ($1,$2,$3,$4,'confirmed',$5,$6)
      RETURNING id, created_at, status
    `;
    const ins = await client.query(insertBookingQ, [userId, resourceId, timeslot.id, policyId, guest_count, special_requests]);
    const booking = ins.rows[0];

    // 7) optionally decrement timeslot.available_capacity (if capacity is tracked)
    await client.query(`UPDATE booking.timeslots SET available_capacity = available_capacity - 1 WHERE id = $1`, [timeslot.id]);

    // 8) optionally create a payment record if required (we'll insert a pending payment)
    const payQ = `
      INSERT INTO booking.payments (booking_id, amount, amount_paid, currency, status, payment_method)
      VALUES ($1, $2, 0, $3, 'pending', NULL)
      RETURNING id
    `;
    // set amount = 0 for now; your pricing logic might live elsewhere
    const pay = await client.query(payQ, [booking.id, 0, 'USD']);

    // 9) create a notification
    const noteQ = `
      INSERT INTO booking.notifications (user_id, booking_id, channel, type, subject, body, payload, status)
      VALUES ($1, $2, 'email', 'booking_confirmation', 'Booking confirmed', 'Your booking is confirmed', '{"template":"confirmation"}', 'queued')
      RETURNING id
    `;
    const note = await client.query(noteQ, [userId, booking.id]);

    await client.query('COMMIT');

    return res.status(201).json({ booking_id: booking.id, payment_id: pay.rows[0].id, notification_id: note.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('booking creation error', err);
    if (err.status) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

module.exports = { createBooking };
