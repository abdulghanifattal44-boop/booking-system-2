import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../db/pool.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  // Keep payload minimal
  return jwt.sign(
    { role: user.role, email: user.email },
    JWT_SECRET,
    { subject: user.id, expiresIn: JWT_EXPIRES_IN }
  );
}

async function getRoleId(roleName) {
  const { rows } = await pool.query(
    `SELECT id FROM booking.roles WHERE name = $1 LIMIT 1`,
    [roleName]
  );
  return rows[0]?.id || null;
}

async function getUserByEmail(email) {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.password_hash,
      r.name AS role
    FROM booking.users u
    LEFT JOIN booking.roles r ON r.id = u.role_id
    WHERE LOWER(u.email) = $1
    LIMIT 1
    `,
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

export async function registerCustomer(req, res) {
  const { name, email, phone, password } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email is required" });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "password is required (min 6 chars)" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const customerRoleId = await getRoleId("customer");

    const existing = await getUserByEmail(normalizedEmail);
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      if (!existing.password_hash) {
        // upgrade legacy user (created before passwords)
        const upd = await pool.query(
          `
          UPDATE booking.users
          SET password_hash = $2,
              role_id = COALESCE(role_id, $3),
              updated_at = NOW()
          WHERE id = $1
          RETURNING id
          `,
          [existing.id, passwordHash, customerRoleId]
        );

        const user = {
          id: upd.rows[0].id,
          name: existing.name,
          email: normalizedEmail,
          phone: existing.phone,
          role: existing.role || "customer",
        };

        const token = signToken(user);
        return res.status(200).json({ user, token });
      }

      return res
        .status(409)
        .json({ error: "Account already exists. Please login." });
    }

    const insertRes = await pool.query(
      `
      INSERT INTO booking.users (name, email, phone, role_id, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone
      `,
      [name || "Customer", normalizedEmail, phone || null, customerRoleId, passwordHash]
    );

    const user = {
      ...insertRes.rows[0],
      role: "customer",
    };

    const token = signToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    console.error("❌ Error registering customer:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function loginCustomer(req, res) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email is required" });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "password is required" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = await getUserByEmail(normalizedEmail);

    if (!userRow) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!userRow.password_hash) {
      return res.status(409).json({
        error: "Account exists but has no password. Set a password first.",
        action: "set_password",
      });
    }

    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    await pool.query(
      `UPDATE booking.users SET last_login = NOW() WHERE id = $1`,
      [userRow.id]
    );

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role || "customer",
    };

    const token = signToken(user);
    return res.json({ user, token });
  } catch (err) {
    console.error("❌ Error logging in:", err);
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/set-password
export async function setPassword(req, res) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email is required" });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "password is required (min 6 chars)" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const userRow = await getUserByEmail(normalizedEmail);

    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      UPDATE booking.users
      SET password_hash = $2,
          updated_at = NOW()
      WHERE id = $1
      `,
      [userRow.id, passwordHash]
    );

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role || "customer",
    };

    const token = signToken(user);
    return res.json({ user, token });
  } catch (err) {
    console.error("❌ Error setting password:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/auth/me
export async function getMe(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { rows } = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        r.name AS role
      FROM booking.users u
      LEFT JOIN booking.roles r ON r.id = u.role_id
      WHERE u.id = $1::uuid
      LIMIT 1
      `,
      [userId]
    );

    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error("❌ Error fetching me:", err);
    return res.status(500).json({ error: err.message });
  }
}
