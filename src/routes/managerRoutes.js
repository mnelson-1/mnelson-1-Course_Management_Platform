const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply authentication and manager role check to all routes
router.use(auth);
router.use(roleCheck(['manager']));

// Manager dashboard and profile
router.get('/dashboard', managerController.getManagerDashboard);

// Facilitator management
router.get('/facilitators', managerController.getManagedFacilitators);
router.get('/facilitators/:facilitatorId', managerController.getFacilitatorDetails);

// Cohort management
router.get('/cohorts', managerController.getManagedCohorts);
router.post('/cohorts/assign', managerController.assignCohort);
router.get('/cohorts/:cohortId/students', managerController.getCohortStudents);

// Student management
router.put('/students/:studentId/cohort', managerController.updateStudentCohort);

// Course offering management
router.get('/course-offerings', managerController.getManagerCourseOfferings);

module.exports = router;