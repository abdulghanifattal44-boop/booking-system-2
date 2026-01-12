/**
 * Simple notifications worker:
 * - claims rows in status = 'queued' using UPDATE ... RETURNING (to minimize race conditions)
 * - tries to send email (nodemailer) or SMS (placeholder)
 * - on success -> set status = 'sent', sent_at = now()
 * - on fail -> increment retry_count, set status='failed' if over limit
 */

const pool = require('../db/pool');
const nodemailer = require('nodemailer');

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 5000; // run every 5s

// configure transporter via env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function processBatch() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // claim notifications: atomically set status to 'processing' and return rows
    const claimQ = `
      WITH c AS (
        SELECT id FROM booking.notifications
        WHERE status = 'queued'
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT $1
      )
      UPDATE booking.notifications n
      SET status = 'processing'
      FROM c
      WHERE n.id = c.id
      RETURNING n.id, n.user_id, n.booking_id, n.channel, n.type, n.subject, n.body, n.payload, n.retry_count;
    `;
    const { rows } = await client.query(claimQ, [BATCH_SIZE]);

    if (rows.length === 0) {
      await client.query('COMMIT');
      return;
    }

    for (const not of rows) {
      try {
        if (not.channel === 'email') {
          // get user email
          const u = await client.query('SELECT email, name FROM booking.users WHERE id = $1', [not.user_id]);
          const user = u.rows[0];
          if (!user || !user.email) throw new Error('User or email missing');

          await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: not.subject || 'Notification',
            text: not.body || '',
            html: (not.payload && not.payload.html) ? not.payload.html : undefined
          });

          await client.query(
            `UPDATE booking.notifications SET status = 'sent', sent_at = now() WHERE id = $1`,
            [not.id]
          );
        } else if (not.channel === 'sms') {
          // Implement SMS sending via provider SDK
          // For now simulate success
          await client.query(`UPDATE booking.notifications SET status = 'sent', sent_at = now() WHERE id = $1`, [not.id]);
        } else {
          // unsupported -> mark failed
          await client.query(
            `UPDATE booking.notifications SET retry_count = retry_count + 1, status = CASE WHEN retry_count + 1 >= $2 THEN 'failed' ELSE 'queued' END WHERE id = $1`,
            [not.id, MAX_RETRIES]
          );
        }
      } catch (err) {
        console.error('notification send failed', not.id, err);
        // increment retry count and set status appropriately
        await client.query(
          `UPDATE booking.notifications SET retry_count = retry_count + 1, status = CASE WHEN retry_count + 1 >= $2 THEN 'failed' ELSE 'queued' END WHERE id = $1`,
          [not.id, MAX_RETRIES]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('processBatch outer error', err);
  } finally {
    client.release();
  }
}

async function runLoop() {
  console.log('Notifications worker started');
  setInterval(processBatch, POLL_INTERVAL_MS);
}

if (require.main === module) {
  runLoop();
}

module.exports = { runLoop, processBatch };
