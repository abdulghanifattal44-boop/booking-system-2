// src/modules/admin/admin.routes.js
import express from "express";

import {
  createOrganization,
  listOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
} from "./organization.controller.js";

import {
  createBranch,
  listBranchesForOrg,
  updateBranch,
  deleteBranch,
} from "./branch.controller.js";

import {
  createResource,
  listResourcesForBranch,
  updateResource,
  deleteResource,
} from "./resource.controller.js";

import {
  generateTimeslots,
  listResourceTimeslots,
} from "./timeslot.controller.js";

import {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
} from "./user.controller.js";

import {
  listAllResourceTypes,
  listResourceTypesForOrg,
  createResourceType,
  updateResourceType,
  deleteResourceType,
} from "./resourceType.controller.js";

import {
  listScheduleTemplates,
  createScheduleTemplate,
  updateScheduleTemplate,
  deleteScheduleTemplate,
} from "./scheduleTemplate.controller.js";

import {
  listBookingsAdmin,
  listBookingsByOrg,
  listBookingsByBranch,
  updateBookingStatus,
} from "./booking.controller.js";

const router = express.Router();

// ========== Organizations ==========
router.post("/organizations", createOrganization);
router.get("/organizations", listOrganizations);
router.get("/organizations/:orgId", getOrganization);
router.put("/organizations/:orgId", updateOrganization);
router.delete("/organizations/:orgId", deleteOrganization);

// ========== Branches ==========
router.post("/organizations/:orgId/branches", createBranch);
router.get("/organizations/:orgId/branches", listBranchesForOrg);
router.put("/branches/:branchId", updateBranch);
router.delete("/branches/:branchId", deleteBranch);

// ========== Resource Types ==========
router.get("/resource-types", listAllResourceTypes);
router.post("/resource-types", createResourceType);
router.put("/resource-types/:typeId", updateResourceType);
router.delete("/resource-types/:typeId", deleteResourceType);

// أنواع الموارد المستخدمة في منظمة معيّنة
router.get(
  "/organizations/:orgId/resource-types",
  listResourceTypesForOrg
);

// ========== Resources ==========
router.post("/branches/:branchId/resources", createResource);
router.get("/branches/:branchId/resources", listResourcesForBranch);
router.put("/resources/:resourceId", updateResource);
router.delete("/resources/:resourceId", deleteResource);

// ========== Schedule Templates ==========
router.get(
  "/resources/:resourceId/schedule-templates",
  listScheduleTemplates
);
router.post(
  "/resources/:resourceId/schedule-templates",
  createScheduleTemplate
);
router.put(
  "/resources/:resourceId/schedule-templates/:templateId",
  updateScheduleTemplate
);
router.delete(
  "/resources/:resourceId/schedule-templates/:templateId",
  deleteScheduleTemplate
);

// ========== Timeslots (Admin) ==========
router.post(
  "/resources/:resourceId/timeslots/generate",
  generateTimeslots
);
router.get(
  "/resources/:resourceId/timeslots",
  listResourceTimeslots
);

// ========== Bookings (Admin) ==========
// فلتر عام: org_id / branch_id / resource_id / email / status / from / to
router.get("/bookings", listBookingsAdmin);
router.put("/bookings/:bookingId/status", updateBookingStatus);

// كل الحجوزات على مستوى منظمة
router.get("/organizations/:orgId/bookings", listBookingsByOrg);

// كل الحجوزات على مستوى فرع
router.get("/branches/:branchId/bookings", listBookingsByBranch);

// ========== Users (Admin) ==========
router.post("/users", createUser);
router.get("/users", listUsers);
router.put("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

export default router;
