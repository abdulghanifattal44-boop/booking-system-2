// src/db/pool.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/booking",
  options: "-c search_path=booking,public",
});

// اختياري: لوج الاتصال
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL (pool.js)"))
  .catch((err) =>
    console.error("❌ Database connection error in pool.js:", err.stack)
  );

export default pool;
