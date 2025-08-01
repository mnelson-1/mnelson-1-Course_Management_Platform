const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, validate } = require('../middleware/validation');
const auth = require('../middleware/auth');

// Unified login endpoint
router.post('/login', authController.login);
router.post('/register', registerValidation, validate, authController.register);
router.post('/logout', auth, authController.logout);

module.exports = router;