// src/modules/admin/resourceType.controller.js
import pool from "../../db/pool.js";

// GET /admin/resource-types
export async function listAllResourceTypes(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        slot_duration_min,
        max_booking_days,
        min_booking_hours,
        settings,
        created_at,
        updated_at
      FROM booking.resource_types
      ORDER BY created_at DESC
      `
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing resource types:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /admin/organizations/:orgId/resource-types
export async function listResourceTypesForOrg(req, res) {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT DISTINCT
        rt.id,
        rt.name,
        rt.description,
        rt.slot_duration_min,
        rt.max_booking_days,
        rt.min_booking_hours,
        rt.settings,
        rt.created_at,
        rt.updated_at
      FROM booking.resource_types rt
      JOIN booking.resources r ON r.type_id = rt.id
      JOIN booking.branches b ON b.id = r.branch_id
      WHERE b.org_id = $1
      ORDER BY rt.name ASC
      `,
      [orgId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing org resource types:", err);
    return res.status(500).json({ error: err.message });
  }
}

// POST /admin/resource-types
export async function createResourceType(req, res) {
  const {
    name,
    description,
    slot_duration_min,
    max_booking_days,
    min_booking_hours,
    settings,
  } = req.body;

  if (!name || !slot_duration_min) {
    return res
      .status(400)
      .json({ error: "name and slot_duration_min are required" });
  }

  try {
    const settingsJson =
      settings !== undefined && settings !== null
        ? JSON.stringify(settings)
        : null;

    const result = await pool.query(
      `
      INSERT INTO booking.resource_types
        (name, description, slot_duration_min, max_booking_days, min_booking_hours, settings)
      VALUES
        ($1, $2, $3, $4, $5, COALESCE($6::jsonb, '{}'::jsonb))
      RETURNING
        id,
        name,
        description,
        slot_duration_min,
        max_booking_days,
        min_booking_hours,
        settings,
        created_at,
        updated_at
      `,
      [
        name,
        description || null,
        slot_duration_min,
        max_booking_days || null,
        min_booking_hours || null,
        settingsJson,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating resource type:", err);
    return res.status(500).json({ error: err.message });
  }
}

// PUT /admin/resource-types/:typeId
export async function updateResourceType(req, res) {
  const { typeId } = req.params;
  const {
    name,
    description,
    slot_duration_min,
    max_booking_days,
    min_booking_hours,
    settings,
  } = req.body;

  try {
    const settingsJson =
      settings !== undefined && settings !== null
        ? JSON.stringify(settings)
        : null;

    const result = await pool.query(
      `
      UPDATE booking.resource_types
      SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        slot_duration_min = COALESCE($4, slot_duration_min),
        max_booking_days = COALESCE($5, max_booking_days),
        min_booking_hours = COALESCE($6, min_booking_hours),
        settings = COALESCE($7::jsonb, settings),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        name,
        description,
        slot_duration_min,
        max_booking_days,
        min_booking_hours,
        settings,
        created_at,
        updated_at
      `,
      [
        typeId,
        name || null,
        description || null,
        slot_duration_min || null,
        max_booking_days || null,
        min_booking_hours || null,
        settingsJson,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Resource type not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating resource type:", err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /admin/resource-types/:typeId
export async function deleteResourceType(req, res) {
  const { typeId } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM booking.resource_types
      WHERE id = $1
      RETURNING
        id,
        name,
        description,
        slot_duration_min,
        max_booking_days,
        min_booking_hours,
        settings,
        created_at,
        updated_at
      `,
      [typeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Resource type not found" });
    }

    return res.json({
      success: true,
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting resource type:", err);
    return res.status(500).json({ error: err.message });
  }
}
