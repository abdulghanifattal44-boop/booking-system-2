import pool from "../../db/pool.js";

// GET /api/public/organizations
export async function listPublicOrganizations(_req, res) {
  try {
    const result = await pool.query(
      `
      SELECT id, name
      FROM booking.organizations
      ORDER BY name ASC
      `
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing public organizations:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/public/organizations/:orgId/branches
export async function listPublicBranchesForOrg(req, res) {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT id, org_id, name, timezone
      FROM booking.branches
      WHERE org_id = $1 AND active = true
      ORDER BY name ASC
      `,
      [orgId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing public branches:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/public/branches/:branchId/resources
export async function listPublicResourcesForBranch(req, res) {
  const { branchId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT id, branch_id, type_id, name, description, capacity
      FROM booking.resources
      WHERE branch_id = $1 AND active = true
      ORDER BY name ASC
      `,
      [branchId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listing public resources:", err);
    return res.status(500).json({ error: err.message });
  }
}
