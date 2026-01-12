// src/modules/admin/branch.controller.js
import pool from "../../db/pool.js";

// POST /admin/organizations/:orgId/branches
export async function createBranch(req, res) {
  const { orgId } = req.params;
  const { name, timezone, contact_info, address, settings, active } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const contactInfoJson =
      contact_info !== undefined && contact_info !== null
        ? JSON.stringify(contact_info)
        : null;
    const addressJson =
      address !== undefined && address !== null ? JSON.stringify(address) : null;
    const settingsJson =
      settings !== undefined && settings !== null
        ? JSON.stringify(settings)
        : null;

    const result = await pool.query(
      `
      INSERT INTO booking.branches
        (org_id, name, timezone, contact_info, address, settings, active)
      VALUES
        ($1, $2, $3, COALESCE($4::jsonb, '{}'::jsonb),
              COALESCE($5::jsonb, '{}'::jsonb),
              COALESCE($6::jsonb, '{}'::jsonb),
              COALESCE($7, true))
      RETURNING
        id, org_id, name, timezone, contact_info, address, settings,
        active, created_at, updated_at
      `,
      [
        orgId,
        name,
        timezone || null,
        contactInfoJson,
        addressJson,
        settingsJson,
        active,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating branch:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /admin/organizations/:orgId/branches
export async function listBranchesForOrg(req, res) {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        id, org_id, name, timezone, contact_info, address, settings,
        active, created_at, updated_at
      FROM booking.branches
      WHERE org_id = $1
      ORDER BY created_at DESC
      `,
      [orgId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing branches:", err);
    return res.status(500).json({ error: err.message });
  }
}

// PUT /admin/branches/:branchId
export async function updateBranch(req, res) {
  const { branchId } = req.params;
  const { name, timezone, contact_info, address, settings, active } = req.body;

  try {
    const contactInfoJson =
      contact_info !== undefined && contact_info !== null
        ? JSON.stringify(contact_info)
        : null;
    const addressJson =
      address !== undefined && address !== null ? JSON.stringify(address) : null;
    const settingsJson =
      settings !== undefined && settings !== null
        ? JSON.stringify(settings)
        : null;

    const result = await pool.query(
      `
      UPDATE booking.branches
      SET
        name = COALESCE($2, name),
        timezone = COALESCE($3, timezone),
        contact_info = COALESCE($4::jsonb, contact_info),
        address = COALESCE($5::jsonb, address),
        settings = COALESCE($6::jsonb, settings),
        active = COALESCE($7, active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, org_id, name, timezone, contact_info, address, settings,
        active, created_at, updated_at
      `,
      [
        branchId,
        name || null,
        timezone || null,
        contactInfoJson,
        addressJson,
        settingsJson,
        active,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating branch:", err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /admin/branches/:branchId
export async function deleteBranch(req, res) {
  const { branchId } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM booking.branches
      WHERE id = $1
      RETURNING
        id, org_id, name, timezone, contact_info, address, settings,
        active, created_at, updated_at
      `,
      [branchId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }

    return res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error("❌ Error deleting branch:", err);
    return res.status(500).json({ error: err.message });
  }
}
