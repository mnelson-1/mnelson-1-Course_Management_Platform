const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Unified login endpoint
router.post('/login', authController.login);

module.exports = router;