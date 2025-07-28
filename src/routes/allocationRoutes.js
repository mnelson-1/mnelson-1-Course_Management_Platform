const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, allocationController.createAllocation);
router.get('/', authMiddleware, allocationController.getAllocations);

module.exports = router;