const {
  Facilitator,
  Manager,
  CourseOffering,
  Module,
  Cohort,
  Class,
  Mode,
  User,
  Student,
  StudentEnrollment
} = require('../models');
const { Op } = require('sequelize');

// Get facilitator's profile and dashboard data
exports.getMyDetails = async (req, res) => {
  try {
    const facilitatorId = req.user.facilitatorId;

    const facilitator = await Facilitator.findByPk(facilitatorId, {
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
              through: {
                model: StudentEnrollment,
                as: 'enrollment',
                attributes: ['enrollmentDate', 'status', 'finalGrade', 'attendance']
              },
              include: [{ model: User, as: 'user' }]
            }
          ]
        }
      ]
    });

    if (!facilitator) {
      return res.status(404).json({ error: 'Facilitator profile not found' });
    }

    // Calculate statistics
    const totalCourseOfferings = facilitator.courseOfferings.length;
    const activeCourseOfferings = facilitator.courseOfferings.filter(co => co.status === 'active').length;
    const totalStudents = facilitator.courseOfferings.reduce((sum, co) => sum + co.enrolledStudents.length, 0);

    res.json({
      facilitator,
      statistics: {
        totalCourseOfferings,
        activeCourseOfferings,
        totalStudents,
        completedCourseOfferings: facilitator.courseOfferings.filter(co => co.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Error fetching facilitator details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get facilitator's assigned course offerings
exports.getMyCourseOfferings = async (req, res) => {
  try {
    const facilitatorId = req.user.facilitatorId;
    const {
      trimester,
      year,
      status,
      cohortId,
      page = 1,
      limit = 10
    } = req.query;

    const filters = { facilitatorId };
    if (trimester) filters.trimester = trimester;
    if (year) filters.year = year;
    if (status) filters.status = status;
    if (cohortId) filters.cohortId = cohortId;

    const offset = (page - 1) * limit;

    const { count, rows: courseOfferings } = await CourseOffering.findAndCountAll({
      where: filters,
      include: [
        { model: Module, as: 'module' },
        { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        { model: Mode, as: 'mode' },
        {
          model: Student,
          as: 'enrolledStudents',
          through: {
            model: StudentEnrollment,
            as: 'enrollment',
            attributes: ['enrollmentDate', 'status', 'finalGrade', 'attendance']
          },
          include: [{ model: User, as: 'user' }]
        }
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
    console.error('Error fetching facilitator course offerings:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific course offering details
exports.getCourseOfferingDetails = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const facilitatorId = req.user.facilitatorId;

    const courseOffering = await CourseOffering.findOne({
      where: { id: courseOfferingId, facilitatorId },
      include: [
        { model: Module, as: 'module' },
        { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        { model: Mode, as: 'mode' },
        {
          model: Student,
          as: 'enrolledStudents',
          through: {
            model: StudentEnrollment,
            as: 'enrollment',
            attributes: ['id', 'enrollmentDate', 'status', 'finalGrade', 'attendance', 'notes']
          },
          include: [
            { model: User, as: 'user' },
            { model: Cohort, as: 'cohort' },
            { model: Class, as: 'class' }
          ]
        }
      ]
    });

    if (!courseOffering) {
      return res.status(404).json({ error: 'Course offering not found or not assigned to you' });
    }

    res.json(courseOffering);
  } catch (error) {
    console.error('Error fetching course offering details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get students in a specific course offering
exports.getCourseStudents = async (req, res) => {
  try {
    const { courseOfferingId } = req.params;
    const facilitatorId = req.user.facilitatorId;
    const { page = 1, limit = 20, search, status } = req.query;

    // Verify facilitator has access to this course offering
    const courseOffering = await CourseOffering.findOne({
      where: { id: courseOfferingId, facilitatorId }
    });

    if (!courseOffering) {
      return res.status(403).json({ error: 'You do not have access to this course offering' });
    }

    const whereClause = { courseOfferingId };
    
    if (status) {
      whereClause.status = status;
    }

    let includeClause = [
      {
        model: Student,
        as: 'student',
        include: [
          { model: User, as: 'user' },
          { model: Cohort, as: 'cohort' },
          { model: Class, as: 'class' }
        ]
      }
    ];

    if (search) {
      includeClause[0].where = {
        [Op.or]: [
          { '$student.user.firstName$': { [Op.like]: `%${search}%` } },
          { '$student.user.lastName$': { [Op.like]: `%${search}%` } },
          { '$student.user.email$': { [Op.like]: `%${search}%` } },
          { '$student.studentId$': { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: enrollments } = await StudentEnrollment.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['enrollmentDate', 'ASC']]
    });

    res.json({
      enrollments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching course students:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update student enrollment (grades, attendance, notes)
exports.updateStudentEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { finalGrade, attendance, notes, status } = req.body;
    const facilitatorId = req.user.facilitatorId;

    // Find the enrollment and verify facilitator has access
    const enrollment = await StudentEnrollment.findByPk(enrollmentId, {
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          where: { facilitatorId }
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found or you do not have access' });
    }

    const updates = {};
    if (finalGrade !== undefined) updates.finalGrade = finalGrade;
    if (attendance !== undefined) updates.attendance = attendance;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    await enrollment.update(updates);

    const updatedEnrollment = await StudentEnrollment.findByPk(enrollmentId, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            { model: User, as: 'user' },
            { model: Cohort, as: 'cohort' }
          ]
        },
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [{ model: Module, as: 'module' }]
        }
      ]
    });

    res.json({
      message: 'Student enrollment updated successfully',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error('Error updating student enrollment:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get facilitator's assigned cohorts
exports.getAssignedCohorts = async (req, res) => {
  try {
    const facilitatorId = req.user.facilitatorId;

    const cohorts = await Cohort.findAll({
      include: [
        {
          model: CourseOffering,
          as: 'courseOfferings',
          where: { facilitatorId },
          include: [
            { model: Module, as: 'module' },
            { model: Mode, as: 'mode' }
          ]
        },
        {
          model: Student,
          as: 'students',
          include: [{ model: User, as: 'user' }]
        }
      ],
      order: [['name', 'ASC']]
    });

    // Remove duplicates and format response
    const uniqueCohorts = cohorts.reduce((acc, cohort) => {
      const existing = acc.find(c => c.id === cohort.id);
      if (!existing) {
        acc.push({
          ...cohort.toJSON(),
          courseOfferings: cohort.courseOfferings
        });
      } else {
        existing.courseOfferings = [...existing.courseOfferings, ...cohort.courseOfferings];
      }
      return acc;
    }, []);

    res.json(uniqueCohorts);
  } catch (error) {
    console.error('Error fetching assigned cohorts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get facilitator's manager information
exports.getMyManager = async (req, res) => {
  try {
    const facilitatorId = req.user.facilitatorId;

    const facilitator = await Facilitator.findByPk(facilitatorId, {
      include: [
        {
          model: Manager,
          as: 'manager',
          include: [
            { model: User, as: 'user' },
            {
              model: Facilitator,
              as: 'facilitators',
              include: [{ model: User, as: 'user' }]
            }
          ]
        }
      ]
    });

    if (!facilitator || !facilitator.manager) {
      return res.status(404).json({ error: 'Manager information not found' });
    }

    res.json({
      manager: facilitator.manager,
      teamFacilitators: facilitator.manager.facilitators.filter(f => f.id !== facilitatorId)
    });
  } catch (error) {
    console.error('Error fetching manager information:', error);
    res.status(500).json({ error: error.message });
  }
};