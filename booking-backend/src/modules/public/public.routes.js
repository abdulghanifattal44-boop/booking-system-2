import { Router } from "express";
import {
  listPublicOrganizations,
  listPublicBranchesForOrg,
  listPublicResourcesForBranch,
} from "./public.controller.js";

const router = Router();

router.get("/organizations", listPublicOrganizations);
router.get("/organizations/:orgId/branches", listPublicBranchesForOrg);
router.get("/branches/:branchId/resources", listPublicResourcesForBranch);

export default router;
