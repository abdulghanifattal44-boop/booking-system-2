const pool = require('../db/pool');

// call generate_timeslots_next_7_days
async function generateNext7Days(req, res) {
  try {
    const { rows } = await pool.query(`SELECT booking.generate_timeslots_next_7_days()`);
    res.json({ inserted_count: rows[0].generate_timeslots_next_7_days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'generate failed' });
  }
}
module.exports = { generateNext7Days };
