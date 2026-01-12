// src/modules/admin/booking.controller.js
import pool from "../../db/pool.js";

/**
 * GET /admin/bookings
 * فلاتر اختيارية: org_id / branch_id / resource_id / email / status / from / to
 */
export async function listBookingsAdmin(req, res) {
  const {
    org_id,
    branch_id,
    resource_id,
    email,
    status,
    from,
    to,
  } = req.query;

  const params = [];
  const where = [];

  let query = `
    SELECT
      b.*,
      u.email AS user_email,
      u.name AS user_name,
      u.phone AS user_phone,
      r.name AS resource_name,
      r.branch_id,
      br.org_id,
      br.name AS branch_name,
      t.start_at AS timeslot_start,
      t.end_at AS timeslot_end
    FROM booking.bookings b
    LEFT JOIN booking.users u ON u.id = b.user_id
    LEFT JOIN booking.resources r ON r.id = b.resource_id
    LEFT JOIN booking.branches br ON br.id = r.branch_id
    LEFT JOIN booking.timeslots t ON t.id = b.timeslot_id
    WHERE 1=1
  `;

  if (org_id) {
    params.push(org_id);
    where.push(`br.org_id = $${params.length}`);
  }

  if (branch_id) {
    params.push(branch_id);
    where.push(`r.branch_id = $${params.length}`);
  }

  if (resource_id) {
    params.push(resource_id);
    where.push(`b.resource_id = $${params.length}`);
  }

  if (email) {
    params.push(email.toLowerCase());
    where.push(`LOWER(u.email) = $${params.length}`);
  }

  if (status) {
    params.push(status);
    where.push(`b.status = $${params.length}`);
  }

  if (from) {
    params.push(from);
    where.push(`b.created_at::date >= $${params.length}`);
  }

  if (to) {
    params.push(to);
    where.push(`b.created_at::date <= $${params.length}`);
  }

  if (where.length > 0) {
    query += " AND " + where.join(" AND ");
  }

  query += " ORDER BY b.created_at DESC";

  try {
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing bookings (admin):", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PUT /admin/bookings/:bookingId/status
 * Body: { status: 'confirmed' | 'cancelled' | 'no-show' }
 */
export async function updateBookingStatus(req, res) {
  const { bookingId } = req.params;
  const { status } = req.body;

  if (!["confirmed", "cancelled", "sales-pending", "no-show"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get current booking
    const bookingRes = await client.query(
      `SELECT * FROM booking.bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bookingRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    // If cancelling, restore capacity
    // If it was ALREADY cancelled, don't restore again (logic check)
    // If we move FROM cancelled TO confirmed, we should decrease capacity (complex logic)
    // For simplicity:
    // If New Status is Cancelled AND Old Status != Cancelled => Restore +GuestCount
    // If New Status != Cancelled AND Old Status == Cancelled => Consume -GuestCount

    const isNewCancelled = status === "cancelled";
    const isOldCancelled = booking.status === "cancelled";

    if (isNewCancelled && !isOldCancelled) {
      // Restore capacity
      await client.query(
        `UPDATE booking.timeslots SET available_capacity = available_capacity + $1 WHERE id = $2`,
        [booking.guest_count, booking.timeslot_id]
      );
    } else if (!isNewCancelled && isOldCancelled) {
      // Re-consume capacity
      // Check availability first? For admin override, maybe force it?
      // Let's force it for Admin, but ideally should check.
      await client.query(
        `UPDATE booking.timeslots SET available_capacity = available_capacity - $1 WHERE id = $2`,
        [booking.guest_count, booking.timeslot_id]
      );
    }

    const updateRes = await client.query(
      `UPDATE booking.bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, bookingId]
    );

    await client.query("COMMIT");
    return res.json(updateRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating booking status:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}


/**
 * GET /admin/organizations/:orgId/bookings
 */
export async function listBookingsByOrg(req, res) {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        b.*,
        u.email AS user_email,
        r.branch_id,
        br.org_id
      FROM booking.bookings b
      JOIN booking.resources r ON r.id = b.resource_id
      JOIN booking.branches br ON br.id = r.branch_id
      LEFT JOIN booking.users u ON u.id = b.user_id
      WHERE br.org_id = $1
      ORDER BY b.created_at DESC
      `,
      [orgId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing bookings by org:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /admin/branches/:branchId/bookings
 */
export async function listBookingsByBranch(req, res) {
  const { branchId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        b.*,
        u.email AS user_email,
        r.branch_id,
        br.org_id
      FROM booking.bookings b
      JOIN booking.resources r ON r.id = b.resource_id
      JOIN booking.branches br ON br.id = r.branch_id
      LEFT JOIN booking.users u ON u.id = b.user_id
      WHERE r.branch_id = $1
      ORDER BY b.created_at DESC
      `,
      [branchId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing bookings by branch:", err);
    return res.status(500).json({ error: err.message });
  }
}
