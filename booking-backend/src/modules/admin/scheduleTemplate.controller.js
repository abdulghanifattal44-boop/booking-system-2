// src/modules/admin/scheduleTemplate.controller.js
import pool from "../../db/pool.js";

// GET /admin/resources/:resourceId/schedule-templates
export async function listScheduleTemplates(req, res) {
  const { resourceId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        id, resource_id, day_of_week, start_time, end_time,
        max_capacity, created_at, updated_at
      FROM booking.schedule_templates
      WHERE resource_id = $1
      ORDER BY day_of_week, start_time
      `,
      [resourceId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing schedule templates:", err);
    return res.status(500).json({ error: err.message });
  }
}

// POST /admin/resources/:resourceId/schedule-templates
export async function createScheduleTemplate(req, res) {
  const { resourceId } = req.params;
  const { day_of_week, start_time, end_time, max_capacity } = req.body;

  if (day_of_week === undefined || !start_time || !end_time) {
    return res.status(400).json({
      error: "day_of_week, start_time, and end_time are required",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO booking.schedule_templates
        (resource_id, day_of_week, start_time, end_time, max_capacity)
      VALUES
        ($1, $2, $3, $4, COALESCE($5, 1))
      RETURNING
        id, resource_id, day_of_week, start_time, end_time,
        max_capacity, created_at, updated_at
      `,
      [resourceId, day_of_week, start_time, end_time, max_capacity || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating schedule template:", err);
    return res.status(500).json({ error: err.message });
  }
}

// PUT /admin/resources/:resourceId/schedule-templates/:templateId
export async function updateScheduleTemplate(req, res) {
  const { resourceId, templateId } = req.params;
  const { day_of_week, start_time, end_time, max_capacity } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE booking.schedule_templates
      SET
        day_of_week = COALESCE($3, day_of_week),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        max_capacity = COALESCE($6, max_capacity),
        updated_at = NOW()
      WHERE id = $1
        AND resource_id = $2
      RETURNING
        id, resource_id, day_of_week, start_time, end_time,
        max_capacity, created_at, updated_at
      `,
      [
        templateId,
        resourceId,
        day_of_week ?? null,
        start_time || null,
        end_time || null,
        max_capacity || null,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Schedule template not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating schedule template:", err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /admin/resources/:resourceId/schedule-templates/:templateId
export async function deleteScheduleTemplate(req, res) {
  const { resourceId, templateId } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM booking.schedule_templates
      WHERE id = $1
        AND resource_id = $2
      RETURNING
        id, resource_id, day_of_week, start_time, end_time,
        max_capacity, created_at, updated_at
      `,
      [templateId, resourceId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Schedule template not found" });
    }

    return res.json({
      success: true,
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting schedule template:", err);
    return res.status(500).json({ error: err.message });
  }
}
