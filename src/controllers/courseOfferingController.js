const { 
  CourseOffering, 
  Module, 
  Facilitator, 
  Manager, 
  Cohort, 
  Class, 
  Mode, 
  User,
  Student,
  StudentEnrollment 
} = require('../models');
const { Op } = require('sequelize');

// Create a new course offering (allocation)
exports.createCourseOffering = async (req, res) => {
  try {
    const {
      moduleId,
      facilitatorId,
      cohortId,
      classId,
      modeId,
      trimester,
      year,
      intakePeriod,
      startDate,
      endDate,
      maxStudents,
      location,
      notes
    } = req.body;

    // Verify that the manager has permission to assign this facilitator
    const facilitator = await Facilitator.findByPk(facilitatorId);
    if (!facilitator || facilitator.managerId !== req.user.managerId) {
      return res.status(403).json({ 
        error: 'You can only assign facilitators under your management' 
      });
    }

    // Check for conflicts (same facilitator, same time period)
    const existingOffering = await CourseOffering.findOne({
      where: {
        facilitatorId,
        trimester,
        year,
        intakePeriod,
        [Op.or]: [
          {
            startDate: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            endDate: {
              [Op.between]: [startDate, endDate]
            }
          }
        ]
      }
    });

    if (existingOffering) {
      return res.status(400).json({ 
        error: 'Facilitator already has a course offering during this period' 
      });
    }

    const courseOffering = await CourseOffering.create({
      id: `CO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      moduleId,
      facilitatorId,
      managerId: req.user.managerId,
      cohortId,
      classId,
      modeId,
      trimester,
      year,
      intakePeriod,
      startDate,
      endDate,
      maxStudents: maxStudents || 30,
      location,
      notes
    });

    const createdOffering = await CourseOffering.findByPk(courseOffering.id, {
      include: [
        { model: Module, as: 'module' },
        { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
        { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        { model: Mode, as: 'mode' }
      ]
    });

    res.status(201).json({
      message: 'Course offering created successfully',
      courseOffering: createdOffering
    });
  } catch (error) {
    console.error('Error creating course offering:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get all course offerings with filtering
exports.getCourseOfferings = async (req, res) => {
  try {
    const {
      trimester,
      year,
      cohortId,
      facilitatorId,
      managerId,
      intakePeriod,
      modeId,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const filters = {};
    if (trimester) filters.trimester = trimester;
    if (year) filters.year = year;
    if (cohortId) filters.cohortId = cohortId;
    if (facilitatorId) filters.facilitatorId = facilitatorId;
    if (managerId) filters.managerId = managerId;
    if (intakePeriod) filters.intakePeriod = intakePeriod;
    if (modeId) filters.modeId = modeId;
    if (status) filters.status = status;

    // If user is a manager, only show their managed course offerings
    if (req.user.type === 'manager') {
      filters.managerId = req.user.managerId;
    }

    // If user is a facilitator, only show their assigned course offerings
    if (req.user.type === 'facilitator') {
      filters.facilitatorId = req.user.facilitatorId;
    }

    const offset = (page - 1) * limit;

    const { count, rows: courseOfferings } = await CourseOffering.findAndCountAll({
      where: filters,
      include: [
        { model: Module, as: 'module' },
        { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
        { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        { model: Mode, as: 'mode' }
      ],
      order: [['year', 'DESC'], ['trimester', 'DESC'], ['startDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
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
    console.error('Error fetching course offerings:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific course offering by ID
exports.getCourseOfferingById = async (req, res) => {
  try {
    const { id } = req.params;

    const courseOffering = await CourseOffering.findByPk(id, {
      include: [
        { model: Module, as: 'module' },
        { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
        { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        { model: Mode, as: 'mode' },
        { 
          model: Student, 
          as: 'enrolledStudents',
          through: { model: StudentEnrollment, as: 'enrollment' },
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    if (!courseOffering) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    // Check permissions
    if (req.user.type === 'manager' && courseOffering.managerId !== req.user.managerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.type === 'facilitator' && courseOffering.facilitatorId !== req.user.facilitatorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(courseOffering);
  } catch (error) {
    console.error('Error fetching course offering:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a course offering
exports.updateCourseOffering = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const courseOffering = await CourseOffering.findByPk(id);
    if (!courseOffering) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    // Only managers can update course offerings
    if (req.user.type !== 'manager' || courseOffering.managerId !== req.user.managerId) {
      return res.status(403).json({ error: 'Only the managing manager can update this course offering' });
    }

    // If updating facilitator, verify they're under this manager
    if (updates.facilitatorId && updates.facilitatorId !== courseOffering.facilitatorId) {
      const facilitator = await Facilitator.findByPk(updates.facilitatorId);
      if (!facilitator || facilitator.managerId !== req.user.managerId) {
        return res.status(403).json({ 
          error: 'You can only assign facilitators under your management' 
        });
      }
    }

    await courseOffering.update(updates);

    const updatedOffering = await CourseOffering.findByPk(id, {
      include: [
        { model: Module, as: 'module' },
        { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
        { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        { model: Mode, as: 'mode' }
      ]
    });

    res.json({
      message: 'Course offering updated successfully',
      courseOffering: updatedOffering
    });
  } catch (error) {
    console.error('Error updating course offering:', error);
    res.status(400).json({ error: error.message });
  }
};

// Delete a course offering
exports.deleteCourseOffering = async (req, res) => {
  try {
    const { id } = req.params;

    const courseOffering = await CourseOffering.findByPk(id);
    if (!courseOffering) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    // Only managers can delete course offerings
    if (req.user.type !== 'manager' || courseOffering.managerId !== req.user.managerId) {
      return res.status(403).json({ error: 'Only the managing manager can delete this course offering' });
    }

    // Check if there are enrolled students
    const enrollmentCount = await StudentEnrollment.count({
      where: { courseOfferingId: id }
    });

    if (enrollmentCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete course offering with enrolled students. Please withdraw students first.' 
      });
    }

    await courseOffering.destroy();

    res.json({ message: 'Course offering deleted successfully' });
  } catch (error) {
    console.error('Error deleting course offering:', error);
    res.status(500).json({ error: error.message });
  }
};

// Enroll a student in a course offering
exports.enrollStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    const courseOffering = await CourseOffering.findByPk(id);
    if (!courseOffering) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    // Only managers can enroll students
    if (req.user.type !== 'manager' || courseOffering.managerId !== req.user.managerId) {
      return res.status(403).json({ error: 'Only the managing manager can enroll students' });
    }

    // Check if course offering can accept more students
    if (!courseOffering.canEnrollStudent()) {
      return res.status(400).json({ error: 'Course offering is full or not active' });
    }

    // Check if student is already enrolled
    const existingEnrollment = await StudentEnrollment.findOne({
      where: { studentId, courseOfferingId: id }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Student is already enrolled in this course offering' });
    }

    // Create enrollment
    const enrollment = await StudentEnrollment.create({
      id: `SE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      courseOfferingId: id
    });

    // Update current enrollment count
    await courseOffering.increment('currentEnrollment');

    res.status(201).json({
      message: 'Student enrolled successfully',
      enrollment
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get course offerings statistics
exports.getCourseOfferingsStats = async (req, res) => {
  try {
    const { year, trimester } = req.query;
    const filters = {};
    
    if (year) filters.year = year;
    if (trimester) filters.trimester = trimester;

    // If user is a manager, only show their managed course offerings
    if (req.user.type === 'manager') {
      filters.managerId = req.user.managerId;
    }

    const totalOfferings = await CourseOffering.count({ where: filters });
    const activeOfferings = await CourseOffering.count({ 
      where: { ...filters, status: 'active' } 
    });
    const completedOfferings = await CourseOffering.count({ 
      where: { ...filters, status: 'completed' } 
    });

    const enrollmentStats = await CourseOffering.findAll({
      where: filters,
      attributes: [
        'id',
        'maxStudents',
        'currentEnrollment'
      ]
    });

    const totalCapacity = enrollmentStats.reduce((sum, offering) => sum + offering.maxStudents, 0);
    const totalEnrolled = enrollmentStats.reduce((sum, offering) => sum + offering.currentEnrollment, 0);
    const utilizationRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity * 100).toFixed(2) : 0;

    res.json({
      totalOfferings,
      activeOfferings,
      completedOfferings,
      totalCapacity,
      totalEnrolled,
      utilizationRate: parseFloat(utilizationRate)
    });
  } catch (error) {
    console.error('Error fetching course offerings stats:', error);
    res.status(500).json({ error: error.message });
  }
};