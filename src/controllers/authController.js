const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Manager, Facilitator, Student } = require('../models');

// Unified Login Controller
exports.login = async (req, res) => {
  try {
    // 1. Find user with eager-loaded profile
    const user = await User.findOne({
      where: { email: req.body.email },
      include: [
        { model: Manager, as: 'managerProfile', required: false },      // ADDED 'as: 'manager''
        { model: Facilitator, as: 'facilitatorProfile', required: false }, // ADDED 'as: 'facilitator''
        { model: Student, as: 'studentProfile', required: false }      // ADDED 'as: 'student''
      ]
    });

    // 2. Validate credentials
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Prepare user profile data
    let profile = null;

    if (user.type === 'manager') {
      profile = user.managerProfile;
    } else if (user.type === 'facilitator') {
      profile = user.facilitatorProfile;
    } else if (user.type === 'student') {
      profile = user.studentProfile;
    }

    const profileData = {
      id: user.id,
      email: user.email,
      type: user.type,
      profile: profile // This line expects aliases like user.manager, user.facilitator
    };

    // 4. Generate JWT (expires in 8 hours)
    const token = jwt.sign(
      profileData,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 5. Return token + basic user info
    res.json({
      token,
      user: {
        id: user.id,
        type: user.type,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login Error:", err); // Add this for better server-side logging
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, type, registrationCode, ...otherFields } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // 2. Validate registration code for privileged types
        if (type === 'facilitator' && registrationCode !== process.env.FACILITATOR_REG_CODE) {
            return res.status(403).json({ error: 'Invalid registration code for facilitator.' });
        }
        if (type === 'manager' && registrationCode !== process.env.MANAGER_REG_CODE) {
            return res.status(403).json({ error: 'Invalid registration code for manager.' });
        }

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create the User record
        const newUser = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            type, // Use the type provided in the request body
            isActive: true // Assuming active upon registration
        });

        // 5. Create the associated profile based on 'type'
        let newProfile;
        if (type === 'student') {
            newProfile = await Student.create({
                id: `STU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: newUser.id,
                // Include other student-specific fields from otherFields if desired, e.g., cohortId
                // ...otherFields // Be careful with direct passing of otherFields
            });
        } else if (type === 'facilitator') {
            newProfile = await Facilitator.create({
                id: `FAC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: newUser.id,
                managerId: null, // Facilitator might be assigned to a manager later
                qualification: otherFields.qualification || null, // Example: include qualification from body
                // ...otherFields
            });
        } else if (type === 'manager') {
            newProfile = await Manager.create({
                id: `MGR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: newUser.id,
                // Add any other manager-specific fields if available in otherFields
                // ...otherFields
            });
        } else {
            // This case should ideally be caught by validation, but as a fallback:
            await newUser.destroy(); // Rollback user creation if profile cannot be created
            return res.status(400).json({ error: 'Invalid user type provided.' });
        }

        // 6. Respond with success
        res.status(201).json({
            message: `${type} registration successful.`,
            user: {
                id: newUser.id,
                email: newUser.email,
                type: newUser.type,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            },
            profile: newProfile
        });

    } catch (error) {
        console.error('Registration Error:', error);
        // If a specific error detail is not meant for the client, you can generalize
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
};

// Logout Controller (Keep as is)
exports.logout = async (req, res) => {
    try {
        res.status(200).json({ message: 'Logout successful. Please delete your token on the client-side.' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ error: 'Logout failed', details: error.message });
    }
};