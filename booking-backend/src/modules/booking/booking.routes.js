import express from "express";
import {
  listPublicTimeslots,
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  listBookingsByEmail,
} from "./booking.controller.js";

import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

// =======================
// Public Timeslots (Customer)
// =======================
router.get("/resources/:resourceId/timeslots", listPublicTimeslots);

// =======================
// Bookings (Customer)
// =======================

// ⚠ put by-email before /:bookingId
router.get("/bookings/by-email", listBookingsByEmail);

// Create booking (registration required)
router.post("/bookings", requireAuth, createBooking);

// View / update / cancel by id
router.get("/bookings/:bookingId", getBookingById);
router.put("/bookings/:bookingId", updateBooking);
router.post("/bookings/:bookingId/cancel", cancelBooking);

export default router;
