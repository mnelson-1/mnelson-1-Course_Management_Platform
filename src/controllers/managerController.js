const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
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
  StudentEnrollment,
} = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");

// Get manager dashboard data
exports.getManagerDashboard = async (req, res) => {
  try {
    const managerId = req.user.managerId;

    // Get basic manager info
    const manager = await Manager.findByPk(managerId, {
      include: [
        { model: User, as: 'user' },
        {
          model: Facilitator,
          as: 'facilitators',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    // Get counts for dashboard
    const [facilitatorsCount, cohortsCount, activeCourses] = await Promise.all([
      Facilitator.count({ where: { managerId } }),
      ManagerCohort.count({ where: { managerId } }),
      CourseOffering.count({ 
        where: { 
          managerId,
          status: 'active'
        }
      })
    ]);

    // Get recent activity
    const recentActivity = await CourseOffering.findAll({
      where: { managerId },
      order: [['updatedAt', 'DESC']],
      limit: 5,
      include: [
        { model: Module, as: 'module' },
        { model: Cohort, as: 'cohort' }
      ]
    });

    res.json({
      manager: {
        id: manager.id,
        name: `${manager.user.firstName} ${manager.user.lastName}`,
        email: manager.user.email
      },
      counts: {
        facilitators: facilitatorsCount,
        cohorts: cohortsCount,
        activeCourses
      },
      recentActivity
    });

  } catch (error) {
    console.error('Error getting manager dashboard:', error);
    res.status(500).json({ 
      error: 'Failed to load dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get manager's profile and dashboard data
exports.createFacilitator = async (req, res, next) => {
  let transaction;
  try {
    // Start transaction
    transaction = await sequelize.transaction();

    const {
      email,
      password,
      firstName,
      lastName,
      qualification,
      specialization,
      location,
      hireDate,
      assignedManagerId,
    } = req.body;

    const creatingManagerId = req.user.managerId;
    const managerId = assignedManagerId || creatingManagerId;

    // 1. Verify manager exists first
    const manager = await Manager.findByPk(managerId, { transaction });
    if (!manager) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Specified manager does not exist',
        managerId
      });
    }

    // 2. Check for existing user (in transaction)
    const existingUser = await User.findOne({ 
      where: { email },
      transaction
    });
    
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        existingUserId: existingUser.id
      });
    }

    // 3. Create user and facilitator in transaction
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      id: `user-${uuidv4()}`,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      type: 'facilitator',
      isActive: true
    }, { transaction });

    const newFacilitator = await Facilitator.create({
      id: `fac-${uuidv4()}`,
      userId: newUser.id,
      managerId,
      qualification,
      specialization: specialization || null,
      location,
      hireDate,
      isActive: true
    }, { transaction });

    // Commit only if everything succeeds
    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Facilitator created successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: `${newUser.firstName} ${newUser.lastName}`,
          type: newUser.type
        },
        facilitator: {
          id: newFacilitator.id,
          qualification: newFacilitator.qualification,
          location: newFacilitator.location,
          managerId: newFacilitator.managerId
        }
      }
    });

  } catch (error) {
    // Rollback transaction if it was started
    if (transaction) await transaction.rollback();
    
    console.error('Error in createFacilitator:', error);
    
    // Handle specific Sequelize errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
        { "$user.firstName$": { [Op.like]: `%${search}%` } },
        { "$user.lastName$": { [Op.like]: `%${search}%` } },
        { "$user.email$": { [Op.like]: `%${search}%` } },
        { qualification: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: facilitators } = await Facilitator.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "user" },
        {
          model: CourseOffering,
          as: "courseOfferings",
          include: [
            { model: Module, as: "module" },
            { model: Cohort, as: "cohort" },
            { model: Mode, as: "mode" },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      facilitators,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching managed facilitators:", error);
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
        { model: User, as: "user" },
        {
          model: Manager,
          as: "manager",
          include: [{ model: User, as: "user" }],
        },
        {
          model: CourseOffering,
          as: "courseOfferings",
          include: [
            { model: Module, as: "module" },
            { model: Cohort, as: "cohort" },
            { model: Class, as: "class" },
            { model: Mode, as: "mode" },
            {
              model: Student,
              as: "enrolledStudents",
              through: { model: StudentEnrollment, as: "enrollment" },
            },
          ],
        },
      ],
    });

    if (!facilitator) {
      return res
        .status(404)
        .json({ error: "Facilitator not found or not under your management" });
    }

    res.json(facilitator);
  } catch (error) {
    console.error("Error fetching facilitator details:", error);
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
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: cohorts } = await Cohort.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Manager,
          as: "managers",
          where: { id: managerId },
          through: {
            model: ManagerCohort,
            as: "managerCohort",
            attributes: ["role", "assignedDate"],
          },
        },
        {
          model: Student,
          as: "students",
          include: [{ model: User, as: "user" }],
        },
        {
          model: CourseOffering,
          as: "courseOfferings",
          include: [
            { model: Module, as: "module" },
            {
              model: Facilitator,
              as: "facilitator",
              include: [{ model: User, as: "user" }],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      cohorts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching managed cohorts:", error);
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
      where: { managerId, cohortId },
    });

    if (!managerCohort) {
      return res
        .status(403)
        .json({ error: "You do not have access to this cohort" });
    }

    const whereClause = { cohortId };

    if (search) {
      whereClause[Op.or] = [
        { "$user.firstName$": { [Op.like]: `%${search}%` } },
        { "$user.lastName$": { [Op.like]: `%${search}%` } },
        { "$user.email$": { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: students } = await Student.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "user" },
        { model: Cohort, as: "cohort" },
        { model: Class, as: "class" },
        {
          model: CourseOffering,
          as: "enrolledCourses",
          through: {
            model: StudentEnrollment,
            as: "enrollment",
            attributes: ["enrollmentDate", "status", "finalGrade"],
          },
          include: [
            { model: Module, as: "module" },
            {
              model: Facilitator,
              as: "facilitator",
              include: [{ model: User, as: "user" }],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cohort students:", error);
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
      include: [{ model: Cohort, as: "cohort" }],
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Verify manager has access to current cohort
    const currentCohortAccess = await ManagerCohort.findOne({
      where: { managerId, cohortId: student.cohortId },
    });

    if (!currentCohortAccess) {
      return res
        .status(403)
        .json({
          error: "You do not have access to this student's current cohort",
        });
    }

    // Verify manager has access to new cohort
    const newCohortAccess = await ManagerCohort.findOne({
      where: { managerId, cohortId },
    });

    if (!newCohortAccess) {
      return res
        .status(403)
        .json({ error: "You do not have access to the target cohort" });
    }

    // Update student's cohort
    await student.update({ cohortId });

    const updatedStudent = await Student.findByPk(studentId, {
      include: [
        { model: User, as: "user" },
        { model: Cohort, as: "cohort" },
        { model: Class, as: "class" },
      ],
    });

    res.json({
      message: "Student cohort updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student cohort:", error);
    res.status(400).json({ error: error.message });
  }
};

// Assign manager to cohort
exports.assignCohort = async (req, res) => {
  try {
    const { cohortId } = req.body;
    const managerId = req.user.managerId;
    const { role = "primary" } = req.body;

    // Check if assignment already exists
    const existingAssignment = await ManagerCohort.findOne({
      where: { managerId, cohortId },
    });

    if (existingAssignment) {
      return res
        .status(400)
        .json({ error: "Manager is already assigned to this cohort" });
    }

    // Verify cohort exists
    const cohort = await Cohort.findByPk(cohortId);
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }

    const assignment = await ManagerCohort.create({
      id: `MC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      managerId,
      cohortId,
      role,
    });

    res.status(201).json({
      message: "Manager assigned to cohort successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error assigning manager to cohort:", error);
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
      limit = 10,
    } = req.query;

    const filters = { managerId };
    if (trimester) filters.trimester = trimester;
    if (year) filters.year = year;
    if (status) filters.status = status;
    if (facilitatorId) filters.facilitatorId = facilitatorId;
    if (cohortId) filters.cohortId = cohortId;

    const offset = (page - 1) * limit;

    const { count, rows: courseOfferings } =
      await CourseOffering.findAndCountAll({
        where: filters,
        include: [
          { model: Module, as: "module" },
          {
            model: Facilitator,
            as: "facilitator",
            include: [{ model: User, as: "user" }],
          },
          { model: Cohort, as: "cohort" },
          { model: Class, as: "class" },
          { model: Mode, as: "mode" },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ["year", "DESC"],
          ["trimester", "DESC"],
          ["startDate", "ASC"],
        ],
      });

    res.json({
      courseOfferings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching manager course offerings:", error);
    res.status(500).json({ error: error.message });
  }
};

// NEW: Function to create a new Student
exports.createStudent = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      cohortId,
      classId, // Add any other student-specific fields
      studentId, // This might be an external ID or generated
    } = req.body;

    const creatingManagerId = req.user.managerId; // The ID of the manager performing this action

    // 1. Basic Validation
    if (!email || !password || !firstName || !lastName || !cohortId) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: email, password, firstName, lastName, cohortId",
        });
    }

    // 2. Check if User already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // 3. Verify manager has access to this cohort
    const managerHasCohortAccess = await ManagerCohort.findOne({
      where: { managerId: creatingManagerId, cohortId },
    });
    if (!managerHasCohortAccess) {
      return res
        .status(403)
        .json({
          error:
            "You do not have permission to assign students to this cohort.",
        });
    }

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create the User record
    const newUser = await User.create({
      id: `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      type: "student", // Assign the correct user type
    });

    // 6. Create the Student record, linking to the new User
    const newStudent = await Student.create({
      id:
        studentId ||
        `STU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Use provided studentId or generate one
      userId: newUser.id, // Link to the newly created user
      cohortId: cohortId, // Assign to the specified cohort
      classId: classId || null, // Optional: assign to a class if provided
      // ... add other student-specific fields
    });

    res.status(201).json({
      message: "Student created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        type: newUser.type,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      student: {
        id: newStudent.id,
        cohortId: newStudent.cohortId,
        classId: newStudent.classId,
      },
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: error.message });
  }
};
