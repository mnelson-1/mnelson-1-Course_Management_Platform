const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply authentication and student role check to all routes
router.use(auth);
router.use(roleCheck(['student']));

// Student profile and dashboard
router.get('/profile', studentController.getMyProfile);

// Course enrollment information
router.get('/enrolled-courses', studentController.getMyEnrolledCourses);
router.get('/enrollments/:enrollmentId', studentController.getCourseEnrollmentDetails);
router.get('/available-courses', studentController.getAvailableCourses);

// Academic information
router.get('/transcript', studentController.getMyTranscript);
router.get('/cohort', studentController.getMyCohort);
router.get('/class', studentController.getMyClass);

module.exports = router;