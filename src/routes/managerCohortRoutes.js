const express = require("express");
const router = express.Router();
const managerCohortController = require("../controllers/managerCohortController");

// POST /api/v1/manager-cohorts
router.post("/", managerCohortController.assignManagerToCohort);

// GET /api/v1/manager-cohorts/:managerId
router.get("/:managerId", managerCohortController.getCohortsForManager);

// DELETE /api/v1/manager-cohorts
router.delete("/", managerCohortController.removeManagerFromCohort);

module.exports = router;
