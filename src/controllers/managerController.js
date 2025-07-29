const { 
  Manager, 
  Facilitator, 
  Student, 
  Cohort, 
  CourseOffering, 
  Module, 
  Class, 
  Mode, 
  User,
  ManagerCohort,
  StudentEnrollment 
} = require('../models');
const { Op } = require('sequelize');

// Get manager's profile and dashboard data
exports.getManagerDashboard = async (req, res) => {
  try {
    const managerId = req.user.managerId;

    const manager = await Manager.findByPk(managerId, {
      include: [
        { model: User, as: 'user' },
        { 
          model: Facilitator, 
          as: 'facilitators',
          include: [{ model: User, as: 'user' }]
        },
        {
          model: Cohort,
          as: 'managedCohorts',
          through: { attributes: ['role', 'assignedDate'] }
        }
      ]
    });

    if (!manager) {
      return res.status(404).json({ error: 'Manager profile not found' });
    }

    // Get course offerings statistics
    const courseOfferingsCount = await CourseOffering.count({
      where: { managerId }
    });

    const activeCourseOfferings = await CourseOffering.count({
      where: { managerId, status: 'active' }
    });

    // Get total students under management
    const totalStudents = await Student.count({
      include: [{
        model: Cohort,
        as: 'cohort',
        include: [{
          model: Manager,
          as: 'managers',
          where: { id: managerId },
          through: { attributes: [] }
        }]
      }]
    });

    res.json({
      manager,
      statistics: {
        totalFacilitators: manager.facilitators.length,
        totalCohorts: manager.managedCohorts.length,
        totalCourseOfferings: courseOfferingsCount,
        activeCourseOfferings,
        totalStudents
      }
    });
  } catch (error) {
    console.error('Error fetching manager dashboard:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all facilitators managed by this manager
exports.getManagedFacilitators = async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const { page = 1, limit = 10, search } = req.query;

    const whereClause = { managerId };
    
    if (search) {
      whereClause[Op.or] = [
        { '$user.firstName$': { [Op.like]: `%${search}%` } },
        { '$user.lastName$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
        { qualification: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: facilitators } = await Facilitator.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user' },
        { 
          model: CourseOffering, 
          as: 'courseOfferings',
          include: [
            { model: Module, as: 'module' },
            { model: Cohort, as: 'cohort' },
            { model: Mode, as: 'mode' }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      facilitators,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching managed facilitators:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific facilitator's details
exports.getFacilitatorDetails = async (req, res) => {
  try {
    const { facilitatorId } = req.params;
    const managerId = req.user.managerId;

    const facilitator = await Facilitator.findOne({
      where: { id: facilitatorId, managerId },
      include: [
        { model: User, as: 'user' },
        { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] },
        { 
          model: CourseOffering, 
          as: 'courseOfferings',
          include: [
            { model: Module, as: 'module' },
            { model: Cohort, as: 'cohort' },
            { model: Class, as: 'class' },
            { model: Mode, as: 'mode' },
            { 
              model: Student, 
              as: 'enrolledStudents',
              through: { model: StudentEnrollment, as: 'enrollment' }
            }
          ]
        }
      ]
    });

    if (!facilitator) {
      return res.status(404).json({ error: 'Facilitator not found or not under your management' });
    }

    res.json(facilitator);
  } catch (error) {
    console.error('Error fetching facilitator details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all cohorts managed by this manager
exports.getManagedCohorts = async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const { page = 1, limit = 10, search } = req.query;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: cohorts } = await Cohort.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Manager,
          as: 'managers',
          where: { id: managerId },
          through: { 
            model: ManagerCohort,
            as: 'managerCohort',
            attributes: ['role', 'assignedDate']
          }
        },
        { 
          model: Student, 
          as: 'students',
          include: [{ model: User, as: 'user' }]
        },
        {
          model: CourseOffering,
          as: 'courseOfferings',
          include: [
            { model: Module, as: 'module' },
            { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      cohorts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching managed cohorts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get students in a specific cohort
exports.getCohortStudents = async (req, res) => {
  try {
    const { cohortId } = req.params;
    const managerId = req.user.managerId;
    const { page = 1, limit = 20, search } = req.query;

    // Verify manager has access to this cohort
    const managerCohort = await ManagerCohort.findOne({
      where: { managerId, cohortId }
    });

    if (!managerCohort) {
      return res.status(403).json({ error: 'You do not have access to this cohort' });
    }

    const whereClause = { cohortId };
    
    if (search) {
      whereClause[Op.or] = [
        { '$user.firstName$': { [Op.like]: `%${search}%` } },
        { '$user.lastName$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: students } = await Student.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user' },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        {
          model: CourseOffering,
          as: 'enrolledCourses',
          through: { 
            model: StudentEnrollment,
            as: 'enrollment',
            attributes: ['enrollmentDate', 'status', 'finalGrade']
          },
          include: [
            { model: Module, as: 'module' },
            { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cohort students:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update student's cohort
exports.updateStudentCohort = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { cohortId } = req.body;
    const managerId = req.user.managerId;

    // Verify the student exists
    const student = await Student.findByPk(studentId, {
      include: [{ model: Cohort, as: 'cohort' }]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify manager has access to current cohort
    const currentCohortAccess = await ManagerCohort.findOne({
      where: { managerId, cohortId: student.cohortId }
    });

    if (!currentCohortAccess) {
      return res.status(403).json({ error: 'You do not have access to this student\'s current cohort' });
    }

    // Verify manager has access to new cohort
    const newCohortAccess = await ManagerCohort.findOne({
      where: { managerId, cohortId }
    });

    if (!newCohortAccess) {
      return res.status(403).json({ error: 'You do not have access to the target cohort' });
    }

    // Update student's cohort
    await student.update({ cohortId });

    const updatedStudent = await Student.findByPk(studentId, {
      include: [
        { model: User, as: 'user' },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' }
      ]
    });

    res.json({
      message: 'Student cohort updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student cohort:', error);
    res.status(400).json({ error: error.message });
  }
};

// Assign manager to cohort
exports.assignCohort = async (req, res) => {
  try {
    const { cohortId } = req.body;
    const managerId = req.user.managerId;
    const { role = 'primary' } = req.body;

    // Check if assignment already exists
    const existingAssignment = await ManagerCohort.findOne({
      where: { managerId, cohortId }
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Manager is already assigned to this cohort' });
    }

    // Verify cohort exists
    const cohort = await Cohort.findByPk(cohortId);
    if (!cohort) {
      return res.status(404).json({ error: 'Cohort not found' });
    }

    const assignment = await ManagerCohort.create({
      id: `MC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      managerId,
      cohortId,
      role
    });

    res.status(201).json({
      message: 'Manager assigned to cohort successfully',
      assignment
    });
  } catch (error) {
    console.error('Error assigning manager to cohort:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get manager's course offerings
exports.getManagerCourseOfferings = async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const { 
      trimester, 
      year, 
      status, 
      facilitatorId, 
      cohortId,
      page = 1, 
      limit = 10 
    } = req.query;

    const filters = { managerId };
    if (trimester) filters.trimester = trimester;
    if (year) filters.year = year;
    if (status) filters.status = status;
    if (facilitatorId) filters.facilitatorId = facilitatorId;
    if (cohortId) filters.cohortId = cohortId;

    const offset = (page - 1) * limit;

    const { count, rows: courseOfferings } = await CourseOffering.findAndCountAll({
      where: filters,
      include: [
        { model: Module, as: 'module' },
        { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        { model: Mode, as: 'mode' }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['year', 'DESC'], ['trimester', 'DESC'], ['startDate', 'ASC']]
    });

    res.json({
      courseOfferings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching manager course offerings:', error);
    res.status(500).json({ error: error.message });
  }
};