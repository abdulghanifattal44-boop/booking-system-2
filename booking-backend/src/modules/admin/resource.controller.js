// src/modules/admin/resource.controller.js
import pool from "../../db/pool.js";

// POST /admin/branches/:branchId/resources
export async function createResource(req, res) {
  const { branchId } = req.params;
  const {
    type_id,
    name,
    description,
    capacity,
    features,
    settings,
    active,
  } = req.body;

  if (!type_id || !name) {
    return res.status(400).json({ error: "type_id and name are required" });
  }

  try {
    const featuresJson =
      features !== undefined && features !== null
        ? JSON.stringify(features)
        : null;
    const settingsJson =
      settings !== undefined && settings !== null
        ? JSON.stringify(settings)
        : null;

    const result = await pool.query(
      `
      INSERT INTO booking.resources
        (branch_id, type_id, name, description, capacity, features, settings, active)
      VALUES
        (
          $1,
          $2,
          $3,
          $4,
          COALESCE($5, 1),
          COALESCE($6::jsonb, '[]'::jsonb),
          COALESCE($7::jsonb, '{}'::jsonb),
          COALESCE($8, true)
        )
      RETURNING
        id, branch_id, type_id, name, description, capacity,
        features, settings, active, created_at, updated_at
      `,
      [
        branchId,
        type_id,
        name,
        description || null,
        capacity || null,
        featuresJson,
        settingsJson,
        active,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating resource:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /admin/branches/:branchId/resources
export async function listResourcesForBranch(req, res) {
  const { branchId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        id, branch_id, type_id, name, description, capacity,
        features, settings, active, created_at, updated_at
      FROM booking.resources
      WHERE branch_id = $1
      ORDER BY created_at DESC
      `,
      [branchId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing resources:", err);
    return res.status(500).json({ error: err.message });
  }
}

// PUT /admin/resources/:resourceId
export async function updateResource(req, res) {
  const { resourceId } = req.params;
  const {
    type_id,
    name,
    description,
    capacity,
    features,
    settings,
    active,
  } = req.body;

  try {
    const featuresJson =
      features !== undefined && features !== null
        ? JSON.stringify(features)
        : null;
    const settingsJson =
      settings !== undefined && settings !== null
        ? JSON.stringify(settings)
        : null;

    const result = await pool.query(
      `
      UPDATE booking.resources
      SET
        type_id = COALESCE($2, type_id),
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        capacity = COALESCE($5, capacity),
        features = COALESCE($6::jsonb, features),
        settings = COALESCE($7::jsonb, settings),
        active = COALESCE($8, active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, branch_id, type_id, name, description, capacity,
        features, settings, active, created_at, updated_at
      `,
      [
        resourceId,
        type_id || null,
        name || null,
        description || null,
        capacity || null,
        featuresJson,
        settingsJson,
        active,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating resource:", err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /admin/resources/:resourceId
export async function deleteResource(req, res) {
  const { resourceId } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM booking.resources
      WHERE id = $1
      RETURNING
        id, branch_id, type_id, name, description, capacity,
        features, settings, active, created_at, updated_at
      `,
      [resourceId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json({
      success: true,
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting resource:", err);
    return res.status(500).json({ error: err.message });
  }
}
