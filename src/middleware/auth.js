const jwt = require('jsonwebtoken');
const { User, Manager, Facilitator, Student } = require('../models');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user with role-specific profile
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Manager, as: 'managerProfile' },
        { model: Facilitator, as: 'facilitatorProfile' },
        { model: Student, as: 'studentProfile' }
      ]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Add role-specific IDs to req.user
    req.user = {
      id: user.id,
      email: user.email,
      type: user.type,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Add role-specific profile ID
    if (user.type === 'manager' && user.managerProfile) {
      req.user.managerId = user.managerProfile.id;
    } else if (user.type === 'facilitator' && user.facilitatorProfile) {
      req.user.facilitatorId = user.facilitatorProfile.id;
    } else if (user.type === 'student' && user.studentProfile) {
      req.user.studentId = user.studentProfile.id;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};