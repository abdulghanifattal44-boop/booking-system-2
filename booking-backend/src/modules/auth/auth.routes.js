import express from "express";

import {
  registerCustomer,
  loginCustomer,
  setPassword,
  getMe,
} from "./auth.controller.js";

import { requireAuth } from "../../middleware/auth.js";

const router = express.Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.post("/set-password", setPassword);
router.get("/me", requireAuth, getMe);

export default router;
