// src/modules/admin/timeslot.controller.js
import pool from "../../db/pool.js";

// POST /admin/resources/:resourceId/timeslots/generate
export async function generateTimeslots(req, res) {
  const { resourceId } = req.params;
  const { start_date, end_date } = req.body;

  if (!start_date || !end_date) {
    return res
      .status(400)
      .json({ error: "start_date and end_date are required (YYYY-MM-DD)" });
  }

  try {
    // Call DB function that generates timeslots
    const fnResult = await pool.query(
      `
      SELECT booking.generate_timeslots_for_resource(
        $1::uuid,
        $2::date,
        $3::date
      ) AS created_count
      `,
      [resourceId, start_date, end_date]
    );

    const createdCount = fnResult.rows[0]?.created_count || 0;

    // Fetch generated timeslots within this date range (optional: filter)
    const tsResult = await pool.query(
      `
      SELECT
        id, resource_id, start_at, end_at, status,
        available_capacity, created_at, updated_at
      FROM booking.timeslots
      WHERE resource_id = $1
        AND start_at::date >= $2::date
        AND start_at::date <= $3::date
      ORDER BY start_at ASC
      `,
      [resourceId, start_date, end_date]
    );

    return res.json({
      success: true,
      count: createdCount,
      timeslots: tsResult.rows,
    });
  } catch (err) {
    console.error("❌ Error generating timeslots:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /admin/resources/:resourceId/timeslots
export async function listResourceTimeslots(req, res) {
  const { resourceId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        id, resource_id, start_at, end_at, status,
        available_capacity, created_at, updated_at
      FROM booking.timeslots
      WHERE resource_id = $1
      ORDER BY start_at ASC
      `,
      [resourceId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing resource timeslots:", err);
    return res.status(500).json({ error: err.message });
  }
}
