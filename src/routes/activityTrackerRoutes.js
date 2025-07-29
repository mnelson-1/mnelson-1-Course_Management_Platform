const express = require('express');
const router = express.Router();
const activityTrackerController = require('../controllers/activityTrackerController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply authentication to all routes
router.use(auth);

// Activity Log CRUD operations
router.post('/', 
  roleCheck(['facilitator']), 
  activityTrackerController.createActivityLog
);

router.get('/', 
  roleCheck(['manager', 'facilitator']), 
  activityTrackerController.getActivityLogs
);

router.get('/stats', 
  roleCheck(['manager', 'facilitator']), 
  activityTrackerController.getActivityLogStats
);

router.get('/my-logs', 
  roleCheck(['facilitator']), 
  activityTrackerController.getMyActivityLogs
);

router.get('/compliance', 
  roleCheck(['manager']), 
  activityTrackerController.getComplianceReport
);

router.get('/overdue', 
  roleCheck(['manager']), 
  activityTrackerController.getOverdueLogs
);

router.post('/bulk-create', 
  roleCheck(['facilitator']), 
  activityTrackerController.bulkCreateActivityLogs
);

router.get('/:id', 
  roleCheck(['manager', 'facilitator']), 
  activityTrackerController.getActivityLogById
);

router.put('/:id', 
  roleCheck(['facilitator']), 
  activityTrackerController.updateActivityLog
);

router.delete('/:id', 
  roleCheck(['facilitator']), 
  activityTrackerController.deleteActivityLog
);

module.exports = router;