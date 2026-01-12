const pool = require('../db/pool');

// query timeslots by resource name + date range
async function getAvailableTimeslots(req, res) {
  const { resource_name, start_date, end_date } = req.query;
  const q = `
    SELECT t.id, t.start_at, t.end_at, t.available_capacity
    FROM booking.timeslots t
    JOIN booking.resources r ON r.id = t.resource_id
    WHERE r.name = $1
      AND t.status = 'open'
      AND t.start_at >= $2::timestamptz
      AND t.end_at <= $3::timestamptz
    ORDER BY t.start_at
    LIMIT 200
  `;
  try {
    const { rows } = await pool.query(q, [resource_name, start_date, end_date]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cannot fetch timeslots' });
  }
}
module.exports = { getAvailableTimeslots };
