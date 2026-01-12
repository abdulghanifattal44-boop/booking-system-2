// src/modules/admin/user.controller.js
import pool from "../../db/pool.js";

// POST /admin/users
export async function createUser(req, res) {
  const { name, email, phone, role_id, org_id, status } = req.body;

  if (!name || !email || !role_id) {
    return res
      .status(400)
      .json({ error: "name, email and role_id are required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO booking.users
        (name, email, phone, role_id, org_id, status)
      VALUES
        ($1, LOWER($2), $3, $4, $5, COALESCE($6, 'active'))
      RETURNING
        id, name, email, phone, role_id, org_id, status,
        preferences, last_login, created_at, updated_at
      `,
      [name, email, phone || null, role_id, org_id || null, status || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating user:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /admin/users
export async function listUsers(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        id, name, email, phone, role_id, org_id, status,
        preferences, last_login, created_at, updated_at
      FROM booking.users
      ORDER BY created_at DESC
      `
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing users:", err);
    return res.status(500).json({ error: err.message });
  }
}

// PUT /admin/users/:userId
export async function updateUser(req, res) {
  const { userId } = req.params;
  const { name, phone, status, org_id, role_id, preferences } = req.body;

  try {
    const preferencesJson =
      preferences !== undefined && preferences !== null
        ? JSON.stringify(preferences)
        : null;

    const result = await pool.query(
      `
      UPDATE booking.users
      SET
        name = COALESCE($2, name),
        phone = COALESCE($3, phone),
        status = COALESCE($4, status),
        org_id = COALESCE($5, org_id),
        role_id = COALESCE($6, role_id),
        preferences = COALESCE($7::jsonb, preferences),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, name, email, phone, role_id, org_id, status,
        preferences, last_login, created_at, updated_at
      `,
      [
        userId,
        name || null,
        phone || null,
        status || null,
        org_id || null,
        role_id || null,
        preferencesJson,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating user:", err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /admin/users/:userId
export async function deleteUser(req, res) {
  const { userId } = req.params;

  try {
    // soft delete: set status = 'inactive'
    const result = await pool.query(
      `
      UPDATE booking.users
      SET
        status = 'inactive',
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, name, email, phone, role_id, org_id, status,
        preferences, last_login, created_at, updated_at
      `,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    return res.status(500).json({ error: err.message });
  }
}
