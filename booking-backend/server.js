// server.js
import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

import pool from "./src/db/pool.js";
import adminRoutes from "./src/modules/admin/admin.routes.js";
import bookingRoutes from "./src/modules/booking/booking.routes.js";
import testRoutes from "./src/modules/tests/tests.routes.js";
import authRoutes from "./src/modules/auth/auth.routes.js";
import publicRoutes from "./src/modules/public/public.routes.js";
import { ensureAuthSetup } from "./src/bootstrap/ensureAuthSetup.js";
import { requireAuth, requireAdmin } from "./src/middleware/auth.js";

// ===========================
// Load environment variables
// ===========================
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// ===========================
// Create Express app
// ===========================
const app = express();

// ===========================
// Middleware
// ===========================
app.use(express.json());

// CORS
const allowedOrigins = new Set([
  "http://localhost",
  "http://127.0.0.1",
  "http://localhost:80",
  "http://127.0.0.1:80",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // Frontend container exposed port
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  // Admin frontend (separate port)
  "http://localhost:8082",
  "http://127.0.0.1:8082",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // requests without origin (curl / server-to-server / docker)
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ===========================
// Swagger OpenAPI definition
// ===========================
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Booking API",
    version: "1.0.0",
    description: "Booking system backend (Admin + Customer + Tests)",
  },
  servers: [{ url: "http://localhost:4000" }],
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  paths: {},
};

// ===========================
// Swagger UI route
// ===========================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ===========================
// System Routes
// ===========================
app.get("/", (req, res) => res.send("Booking API is running 🚀"));

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "disconnected",
      message: err.message,
    });
  }
});

// ===========================
// Modules Routes
// ===========================
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", bookingRoutes);
app.use("/api/tests", testRoutes);

// Admin is protected (must be logged in as admin)
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);
// Backward compatibility (still protected)
app.use("/admin", requireAuth, requireAdmin, adminRoutes);

// ===========================
// Error handler
// ===========================
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || "Server error" });
});

// ===========================
// Start Server
// ===========================
const PORT = process.env.PORT || 4000;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function bootstrap() {
  const maxRetries = Number(process.env.DB_BOOTSTRAP_RETRIES || 30);
  const delayMs = Number(process.env.DB_BOOTSTRAP_DELAY_MS || 1500);

  for (let i = 1; i <= maxRetries; i++) {
    try {
      await pool.query("SELECT 1");
      await ensureAuthSetup();
      return;
    } catch (err) {
      console.error(`❌ Bootstrap attempt ${i}/${maxRetries} failed:`, err.message);
      if (i === maxRetries) throw err;
      await sleep(delayMs);
    }
  }
}

bootstrap()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Failed to bootstrap server:", err);
    process.exit(1);
  });
