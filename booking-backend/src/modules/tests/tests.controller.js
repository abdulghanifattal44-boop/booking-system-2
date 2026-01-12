import pool from "../../db/pool.js";

// ضع هنا سكربت الـ DO $$ الكامل الذي أرسلته
const testSuiteSql = `
-- 👇 ضع سكربت الاختبارات DO $$ ... $$ هنا كما هو في رسالتك السابقة
DO $$
DECLARE
  -- ...
BEGIN
  -- ...
END $$;
`;

export async function runDbTests(req, res) {
  try {
    await pool.query(testSuiteSql);
    res.json({
      success: true,
      message: "All DB tests executed successfully. Check Postgres logs for RAISE NOTICE output.",
    });
  } catch (err) {
    console.error("❌ Error running DB test suite:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getTestsSummary(req, res) {
  try {
    const countsQuery = `
      SELECT
        (SELECT COUNT(*) FROM booking.organizations) AS organizations,
        (SELECT COUNT(*) FROM booking.users) AS users,
        (SELECT COUNT(*) FROM booking.branches) AS branches,
        (SELECT COUNT(*) FROM booking.resources) AS resources,
        (SELECT COUNT(*) FROM booking.resource_types) AS resource_types,
        (SELECT COUNT(*) FROM booking.timeslots) AS timeslots,
        (SELECT COUNT(*) FROM booking.bookings) AS bookings,
        (SELECT COUNT(*) FROM booking.payments) AS payments,
        (SELECT COUNT(*) FROM booking.notifications) AS notifications,
        (SELECT COUNT(*) FROM booking.audit_logs) AS audit_logs;
    `;

    const bookingsSummaryQuery = `
      SELECT 
        COUNT(*) AS total_bookings,
        COUNT(DISTINCT user_id) AS unique_users,
        COUNT(DISTINCT resource_id) AS unique_resources,
        AVG(guest_count) AS avg_guests
      FROM booking.bookings;
    `;

    const countsResult = await pool.query(countsQuery);
    const summaryResult = await pool.query(bookingsSummaryQuery);

    res.json({
      success: true,
      counts: countsResult.rows[0],
      bookings_summary: summaryResult.rows[0],
    });
  } catch (err) {
    console.error("❌ Error fetching tests summary:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
