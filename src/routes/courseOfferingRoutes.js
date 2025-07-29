const express = require('express');
const router = express.Router();
const courseOfferingController = require('../controllers/courseOfferingController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply authentication to all routes
router.use(auth);

// Course Offering CRUD operations (Manager only)
router.post('/', 
  roleCheck(['manager']), 
  courseOfferingController.createCourseOffering
);

router.get('/', 
  roleCheck(['manager', 'facilitator']), 
  courseOfferingController.getCourseOfferings
);

router.get('/stats', 
  roleCheck(['manager']), 
  courseOfferingController.getCourseOfferingsStats
);

router.get('/:id', 
  roleCheck(['manager', 'facilitator']), 
  courseOfferingController.getCourseOfferingById
);

router.put('/:id', 
  roleCheck(['manager']), 
  courseOfferingController.updateCourseOffering
);

router.delete('/:id', 
  roleCheck(['manager']), 
  courseOfferingController.deleteCourseOffering
);

// Student enrollment operations (Manager only)
router.post('/:id/enroll', 
  roleCheck(['manager']), 
  courseOfferingController.enrollStudent
);

module.exports = router;