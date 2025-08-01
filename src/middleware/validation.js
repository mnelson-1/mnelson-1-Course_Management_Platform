// middleware/validation.js
const { body, validationResult } = require('express-validator');

// Reusable validation for user registration
const registerValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        .matches(/\d/).withMessage('Password must contain a number.')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter.')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character.'),
    body('firstName').trim().notEmpty().withMessage('First name is required.'),
    body('lastName').trim().notEmpty().withMessage('Last name is required.'),
    body('type')
        .isIn(['student', 'facilitator', 'manager']).withMessage('Invalid user type.'),
    
    body('registrationCode')
        .if(body('type').isIn(['facilitator', 'manager']))
        .notEmpty().withMessage('Registration code is required for this user type.')
];

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

    return res.status(422).json({
        errors: extractedErrors,
    });
};

module.exports = {
    registerValidation,
    validate
};