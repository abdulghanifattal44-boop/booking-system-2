// src/modules/admin/organization.controller.js
import pool from "../../db/pool.js";

// POST /admin/organizations
export async function createOrganization(req, res) {
  const { name, contact_email, phone, address, settings } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const addressJson =
      address !== undefined && address !== null
        ? JSON.stringify(address)
        : null;
    const settingsJson =
      settings !== undefined && settings !== null
        ? JSON.stringify(settings)
        : null;

    const result = await pool.query(
      `
      INSERT INTO booking.organizations
        (name, contact_email, phone, address, settings)
      VALUES
        ($1, $2, $3, COALESCE($4::jsonb, '{}'::jsonb), COALESCE($5::jsonb, '{}'::jsonb))
      RETURNING
        id, name, contact_email, phone, address, settings, created_at, updated_at
      `,
      [name, contact_email || null, phone || null, addressJson, settingsJson]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating organization:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /admin/organizations
export async function listOrganizations(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        id, name, contact_email, phone, address, settings, created_at, updated_at
      FROM booking.organizations
      ORDER BY created_at DESC
      `
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing organizations:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /admin/organizations/:orgId
export async function getOrganization(req, res) {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        id, name, contact_email, phone, address, settings, created_at, updated_at
      FROM booking.organizations
      WHERE id = $1
      `,
      [orgId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error getting organization:", err);
    return res.status(500).json({ error: err.message });
  }
}

// PUT /admin/organizations/:orgId
export async function updateOrganization(req, res) {
  const { orgId } = req.params;
  const { name, contact_email, phone, address, settings } = req.body;

  try {
    const addressJson =
      address !== undefined && address !== null
        ? JSON.stringify(address)
        : null;
    const settingsJson =
      settings !== undefined && settings !== null
        ? JSON.stringify(settings)
        : null;

    const result = await pool.query(
      `
      UPDATE booking.organizations
      SET
        name = COALESCE($2, name),
        contact_email = COALESCE($3, contact_email),
        phone = COALESCE($4, phone),
        address = COALESCE($5::jsonb, address),
        settings = COALESCE($6::jsonb, settings),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, name, contact_email, phone, address, settings, created_at, updated_at
      `,
      [orgId, name || null, contact_email || null, phone || null, addressJson, settingsJson]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating organization:", err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /admin/organizations/:orgId
export async function deleteOrganization(req, res) {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM booking.organizations
      WHERE id = $1
      RETURNING
        id, name, contact_email, phone, address, settings, created_at, updated_at
      `,
      [orgId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error("❌ Error deleting organization:", err);
    return res.status(500).json({ error: err.message });
  }
}
