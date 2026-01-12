import bcrypt from "bcryptjs";
import pool from "../db/pool.js";

async function columnExists(schema, table, column) {
  const { rows } = await pool.query(
    `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
    LIMIT 1
    `,
    [schema, table, column]
  );
  return rows.length > 0;
}

export async function ensureAuthSetup() {
  // 1) Add password_hash column if missing (upgrade old DB volumes)
  const hasPasswordHash = await columnExists("booking", "users", "password_hash");
  if (!hasPasswordHash) {
    await pool.query(`ALTER TABLE booking.users ADD COLUMN password_hash TEXT`);
  }

  // 2) Ensure base roles exist
  await pool.query(
    `
    INSERT INTO booking.roles (name, description)
    VALUES
      ('admin', 'System administrator'),
      ('customer', 'Customer user')
    ON CONFLICT (name) DO NOTHING
    `
  );

  // 3) Ensure admin user exists (if env provided)
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (adminEmail && adminPassword) {
    const roleRes = await pool.query(
      `SELECT id FROM booking.roles WHERE name = 'admin' LIMIT 1`
    );
    const adminRoleId = roleRes.rows[0]?.id;

    const userRes = await pool.query(
      `SELECT id, password_hash FROM booking.users WHERE LOWER(email)= $1 LIMIT 1`,
      [adminEmail]
    );

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (userRes.rowCount === 0) {
      await pool.query(
        `
        INSERT INTO booking.users (name, email, phone, role_id, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        `,
        ["Admin", adminEmail, null, adminRoleId, passwordHash]
      );
    } else {
      const existing = userRes.rows[0];
      if (!existing.password_hash) {
        await pool.query(
          `UPDATE booking.users SET password_hash=$2, role_id=$3 WHERE id=$1`,
          [existing.id, passwordHash, adminRoleId]
        );
      } else {
        // Ensure role is admin
        await pool.query(
          `UPDATE booking.users SET role_id=$2 WHERE id=$1`,
          [existing.id, adminRoleId]
        );
      }
    }
  }
}
