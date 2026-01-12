// src/modules/booking/booking.controller.js
import pool from "../../db/pool.js";

// ===========================
// Helper: find or create customer user by email
// ===========================
async function findOrCreateCustomerUserByEmail({ customer_name, customer_email, customer_phone, resource_id }) {
  const email = customer_email.toLowerCase();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) حاول تجيب المستخدم لو موجود
    const existingUserRes = await client.query(
      `
      SELECT id
      FROM booking.users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (existingUserRes.rowCount > 0) {
      await client.query("COMMIT");
      return existingUserRes.rows[0].id;
    }

    // 2) نجيب org_id من الـ resource عن طريق الفرع
    const orgRes = await client.query(
      `
      SELECT o.id AS org_id
      FROM booking.resources r
      JOIN booking.branches b ON r.branch_id = b.id
      JOIN booking.organizations o ON b.org_id = o.id
      WHERE r.id = $1::uuid
      `,
      [resource_id]
    );

    if (orgRes.rowCount === 0) {
      throw new Error("Invalid resource_id while resolving org_id for customer user");
    }

    const orgId = orgRes.rows[0].org_id;

    // 3) نجيب role_id الخاص بالـ customer
    const roleRes = await client.query(
      `
      SELECT id
      FROM booking.roles
      WHERE name = 'customer'
      LIMIT 1
      `
    );

    if (roleRes.rowCount === 0) {
      throw new Error("Customer role not found in roles table");
    }

    const customerRoleId = roleRes.rows[0].id;

    // 4) إنشاء user جديد
    const nameToUse = customer_name || email;

    const newUserRes = await client.query(
      `
      INSERT INTO booking.users
        (name, email, phone, role_id, org_id, status, preferences)
      VALUES
        ($1, $2, $3, $4, $5, 'active', '{}'::jsonb)
      RETURNING id
      `,
      [nameToUse, email, customer_phone || null, customerRoleId, orgId]
    );

    await client.query("COMMIT");
    return newUserRes.rows[0].id;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error in findOrCreateCustomerUserByEmail:", err);
    throw err;
  } finally {
    client.release();
  }
}

// ===========================
// Public Timeslots (Customer)
// ===========================

// GET /api/resources/:resourceId/timeslots
export async function listPublicTimeslots(req, res) {
  const { resourceId } = req.params;
  const { from, to } = req.query;

  try {
    const params = [resourceId];
    let dateFilter = "";

    if (from) {
      params.push(from);
      dateFilter += ` AND start_at::date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      dateFilter += ` AND start_at::date <= $${params.length}`;
    }

    const result = await pool.query(
      `
      SELECT
        id,
        resource_id,
        start_at,
        end_at,
        status,
        available_capacity
      FROM booking.timeslots
      WHERE resource_id = $1::uuid
        AND status = 'open'
        AND available_capacity > 0
      ${dateFilter}
      ORDER BY start_at ASC
      `,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing public timeslots:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ===========================
// Bookings (Customer)
// ===========================

// POST /api/bookings
export async function createBooking(req, res) {
  const user_id = req.user?.id;
  const {
    resource_id,
    timeslot_id,
    policy_id,
    guest_count,
    special_requests,
  } = req.body;

  const guests = guest_count && guest_count > 0 ? guest_count : 1;

  // تحقق مبدئي
  if (!resource_id || !timeslot_id) {
    return res.status(400).json({
      error: "resource_id and timeslot_id are required",
    });
  }

  // ✅ Registration is required for booking:
  // Guests can browse/search timeslots, but cannot create a booking.
  if (!user_id) {
    return res.status(401).json({
      error: "Registration required: please login/register before booking",
    });
  }

  const finalUserId = user_id;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1) جلب الـ timeslot والتأكد أنه يخص نفس الـ resource
      const tsRes = await client.query(
        `
        SELECT id, resource_id, status, available_capacity
        FROM booking.timeslots
        WHERE id = $1::uuid
        FOR UPDATE
        `,
        [timeslot_id]
      );

      if (tsRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Invalid timeslot_id" });
      }

      const ts = tsRes.rows[0];

      if (ts.resource_id !== resource_id) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "timeslot does not belong to given resource_id" });
      }

      if (ts.status !== "open" || ts.available_capacity < guests) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({ error: "Timeslot is not available" });
      }

      // 2) نقص من الـ capacity
      await client.query(
        `
        UPDATE booking.timeslots
        SET available_capacity = available_capacity - $1
        WHERE id = $2::uuid
        `,
        [guests, timeslot_id]
      );

      // 3) إنشاء الحجز
      const bookingRes = await client.query(
        `
        INSERT INTO booking.bookings
          (user_id, resource_id, timeslot_id, policy_id, status,
           guest_count, special_requests, metadata)
        VALUES
          ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 'confirmed',
           $5, $6, '{}'::jsonb)
        RETURNING
          id, user_id, resource_id, timeslot_id, policy_id, status,
          guest_count, special_requests, metadata,
          created_at, updated_at
        `,
        [
          finalUserId,
          resource_id,
          timeslot_id,
          policy_id || null,
          guests,
          special_requests || null,
        ]
      );

      await client.query("COMMIT");
      return res.status(201).json(bookingRes.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("❌ Error creating booking (tx):", err);
      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ Error creating booking (outer):", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/bookings/:bookingId
export async function getBookingById(req, res) {
  const { bookingId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        b.*,
        u.name  AS customer_name,
        u.email AS customer_email,
        t.start_at,
        t.end_at,
        r.name  AS resource_name
      FROM booking.bookings b
      JOIN booking.users u     ON b.user_id = u.id
      JOIN booking.timeslots t ON b.timeslot_id = t.id
      JOIN booking.resources r ON b.resource_id = r.id
      WHERE b.id = $1::uuid
      `,
      [bookingId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching booking:", err);
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/bookings/:bookingId
// تعديل بسيط: guest_count + special_requests مع ضبط الـ capacity
export async function updateBooking(req, res) {
  const { bookingId } = req.params;
  const { guest_count, special_requests } = req.body;

  if (guest_count !== undefined && guest_count <= 0) {
    return res.status(400).json({ error: "guest_count must be > 0" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) نجيب الحجز الحالي
    const bookingRes = await client.query(
      `
      SELECT id, timeslot_id, guest_count
      FROM booking.bookings
      WHERE id = $1::uuid
      FOR UPDATE
      `,
      [bookingId]
    );

    if (bookingRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRes.rows[0];
    const oldGuests = booking.guest_count;
    const newGuests =
      guest_count !== undefined && guest_count !== null
        ? guest_count
        : oldGuests;
    const diff = newGuests - oldGuests;

    // 2) لو diff > 0 نتحقق من التوافر
    if (diff !== 0) {
      const tsRes = await client.query(
        `
        SELECT id, available_capacity, status
        FROM booking.timeslots
        WHERE id = $1::uuid
        FOR UPDATE
        `,
        [booking.timeslot_id]
      );

      if (tsRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Related timeslot not found" });
      }

      const ts = tsRes.rows[0];

      if (ts.status !== "open" && diff > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "Timeslot is not open for increasing guest_count",
        });
      }

      if (diff > 0 && ts.available_capacity < diff) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({ error: "Not enough capacity to increase guest_count" });
      }

      // نحدّث الـ capacity
      await client.query(
        `
        UPDATE booking.timeslots
        SET available_capacity = available_capacity - $1
        WHERE id = $2::uuid
        `,
        [diff, booking.timeslot_id]
      );
    }

    // 3) نحدّث الحجز نفسه
    const updatedRes = await client.query(
      `
      UPDATE booking.bookings
      SET
        guest_count = $1,
        special_requests = COALESCE($2, special_requests),
        updated_at = NOW()
      WHERE id = $3::uuid
      RETURNING *
      `,
      [newGuests, special_requests || null, bookingId]
    );

    await client.query("COMMIT");
    return res.json(updatedRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating booking:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

// POST /api/bookings/:bookingId/cancel
export async function cancelBooking(req, res) {
  const { bookingId } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const bookingRes = await client.query(
      `
      SELECT id, timeslot_id, guest_count, status
      FROM booking.bookings
      WHERE id = $1::uuid
      FOR UPDATE
      `,
      [bookingId]
    );

    if (bookingRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    if (booking.status === "cancelled") {
      await client.query("ROLLBACK");
      return res.json({ success: true, booking }); // already cancelled
    }

    // رجّع الـ capacity
    await client.query(
      `
      UPDATE booking.timeslots
      SET available_capacity = available_capacity + $1
      WHERE id = $2::uuid
      `,
      [booking.guest_count, booking.timeslot_id]
    );

    const updatedRes = await client.query(
      `
      UPDATE booking.bookings
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING *
      `,
      [bookingId]
    );

    await client.query("COMMIT");
    return res.json({
      success: true,
      booking: updatedRes.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error cancelling booking:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

// ===========================
// Customer: list bookings by email
// ===========================

// GET /api/bookings/by-email?email=...&status=...
export async function listBookingsByEmail(req, res) {
  const { email, status } = req.query;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    const params = [email.toLowerCase()];
    let statusFilter = "";

    if (status) {
      params.push(status);
      statusFilter = ` AND b.status = $2`;
    }

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.user_id,
        b.resource_id,
        b.timeslot_id,
        b.policy_id,
        b.status,
        b.guest_count,
        b.special_requests,
        b.metadata,
        b.created_at,
        b.updated_at,
        u.name  AS customer_name,
        u.email AS customer_email,
        t.start_at,
        t.end_at,
        r.name  AS resource_name
      FROM booking.bookings b
      JOIN booking.users u     ON b.user_id = u.id
      JOIN booking.timeslots t ON b.timeslot_id = t.id
      JOIN booking.resources r ON b.resource_id = r.id
      WHERE LOWER(u.email) = $1
      ${statusFilter}
      ORDER BY t.start_at DESC
      `,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing bookings by email:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ===========================
// Admin: bookings by Org / Branch
// ===========================

// GET /admin/organizations/:orgId/bookings
export async function listBookingsByOrg(req, res) {
  const { orgId } = req.params;
  const { status } = req.query;

  try {
    const params = [orgId];
    let statusFilter = "";

    if (status) {
      params.push(status);
      statusFilter = ` AND b.status = $2`;
    }

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.user_id,
        b.resource_id,
        b.timeslot_id,
        b.policy_id,
        b.status,
        b.guest_count,
        b.special_requests,
        b.metadata,
        b.created_at,
        b.updated_at,
        u.name       AS customer_name,
        u.email      AS customer_email,
        t.start_at,
        t.end_at,
        r.name       AS resource_name,
        br.id        AS branch_id,
        br.name      AS branch_name
      FROM booking.bookings b
      JOIN booking.users u     ON b.user_id = u.id
      JOIN booking.timeslots t ON b.timeslot_id = t.id
      JOIN booking.resources r ON b.resource_id = r.id
      JOIN booking.branches br ON r.branch_id = br.id
      WHERE br.org_id = $1::uuid
      ${statusFilter}
      ORDER BY t.start_at DESC
      `,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing bookings by org:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /admin/branches/:branchId/bookings
export async function listBookingsByBranch(req, res) {
  const { branchId } = req.params;
  const { status } = req.query;

  try {
    const params = [branchId];
    let statusFilter = "";

    if (status) {
      params.push(status);
      statusFilter = ` AND b.status = $2`;
    }

    const result = await pool.query(
      `
      SELECT
        b.id,
        b.user_id,
        b.resource_id,
        b.timeslot_id,
        b.policy_id,
        b.status,
        b.guest_count,
        b.special_requests,
        b.metadata,
        b.created_at,
        b.updated_at,
        u.name       AS customer_name,
        u.email      AS customer_email,
        t.start_at,
        t.end_at,
        r.name       AS resource_name
      FROM booking.bookings b
      JOIN booking.users u     ON b.user_id = u.id
      JOIN booking.timeslots t ON b.timeslot_id = t.id
      JOIN booking.resources r ON b.resource_id = r.id
      JOIN booking.branches br ON r.branch_id = br.id
      WHERE br.id = $1::uuid
      ${statusFilter}
      ORDER BY t.start_at DESC
      `,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing bookings by branch:", err);
    return res.status(500).json({ error: err.message });
  }
}
