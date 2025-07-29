const express = require('express');
const router = express.Router();
const facilitatorController = require('../controllers/facilitatorController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply authentication and facilitator role check to all routes
router.use(auth);
router.use(roleCheck(['facilitator']));

// Facilitator profile and dashboard
router.get('/profile', facilitatorController.getMyDetails);
router.get('/manager', facilitatorController.getMyManager);

// Course offerings management
router.get('/course-offerings', facilitatorController.getMyCourseOfferings);
router.get('/course-offerings/:courseOfferingId', facilitatorController.getCourseOfferingDetails);
router.get('/course-offerings/:courseOfferingId/students', facilitatorController.getCourseStudents);

// Student enrollment management
router.put('/enrollments/:enrollmentId', facilitatorController.updateStudentEnrollment);

// Cohort information
router.get('/cohorts', facilitatorController.getAssignedCohorts);

module.exports = router;