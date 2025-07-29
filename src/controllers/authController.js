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
        { model: Manager, required: false },
        { model: Facilitator, required: false },
        { model: Student, required: false }
      ]
    });

    // 2. Validate credentials
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Prepare user profile data
    const profileData = {
      id: user.id,
      email: user.email,
      type: user.type,
      profile: user[user.type] // Dynamically access the associated profile
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
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};