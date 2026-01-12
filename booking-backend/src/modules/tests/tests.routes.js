import express from "express";
import { runDbTests, getTestsSummary } from "./tests.controller.js";

const router = express.Router();

router.post("/run", runDbTests);
router.get("/summary", getTestsSummary);

export default router;
