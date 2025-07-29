const { 
  ActivityTracker, 
  CourseOffering, 
  Facilitator, 
  Manager, 
  Module, 
  Cohort, 
  Class, 
  Mode, 
  User 
} = require('../models');
const { Op } = require('sequelize');
const redisService = require('../services/redisService');
const notificationService = require('../services/notificationService');

// Create a new activity tracker log
exports.createActivityLog = async (req, res) => {
  try {
    const {
      courseOfferingId,
      weekNumber,
      academicYear,
      trimester,
      attendance,
      formativeOneGrading,
      formativeTwoGrading,
      summativeGrading,
      courseModeration,
      intranetSync,
      gradeBookStatus,
      notes,
      dueDate
    } = req.body;

    const facilitatorId = req.user.facilitatorId;

    // Verify the course offering belongs to this facilitator
    const courseOffering = await CourseOffering.findOne({
      where: { id: courseOfferingId, facilitatorId }
    });

    if (!courseOffering) {
      return res.status(403).json({ 
        error: 'You can only create logs for your assigned course offerings' 
      });
    }

    // Check if log already exists for this week
    const existingLog = await ActivityTracker.findOne({
      where: {
        courseOfferingId,
        facilitatorId,
        weekNumber,
        academicYear,
        trimester
      }
    });

    if (existingLog) {
      return res.status(400).json({ 
        error: 'Activity log already exists for this week' 
      });
    }

    // Create the activity tracker
    const activityTracker = await ActivityTracker.create({
      id: `AT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      courseOfferingId,
      facilitatorId,
      weekNumber,
      academicYear,
      trimester,
      attendance: attendance || [false, false, false, false, false],
      formativeOneGrading: formativeOneGrading || 'Not Started',
      formativeTwoGrading: formativeTwoGrading || 'Not Started',
      summativeGrading: summativeGrading || 'Not Started',
      courseModeration: courseModeration || 'Not Started',
      intranetSync: intranetSync || 'Not Started',
      gradeBookStatus: gradeBookStatus || 'Not Started',
      notes,
      dueDate: dueDate || undefined // Will be set by hook if not provided
    });

    // Schedule reminder notification
    await redisService.addReminderJob(
      facilitatorId,
      activityTracker.id,
      activityTracker.dueDate
    );

    const createdLog = await ActivityTracker.findByPk(activityTracker.id, {
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            { model: Module, as: 'module' },
            { model: Cohort, as: 'cohort' },
            { model: Mode, as: 'mode' }
          ]
        }
      ]
    });

    res.status(201).json({
      message: 'Activity log created successfully',
      activityLog: createdLog
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get activity logs with filtering
exports.getActivityLogs = async (req, res) => {
  try {
    const {
      courseOfferingId,
      facilitatorId,
      weekNumber,
      academicYear,
      trimester,
      isSubmitted,
      isOverdue,
      page = 1,
      limit = 10
    } = req.query;

    const filters = {};
    
    // Role-based filtering
    if (req.user.type === 'facilitator') {
      filters.facilitatorId = req.user.facilitatorId;
    } else if (req.user.type === 'manager') {
      // Managers can see logs for their managed facilitators
      const managedFacilitators = await Facilitator.findAll({
        where: { managerId: req.user.managerId },
        attributes: ['id']
      });
      const facilitatorIds = managedFacilitators.map(f => f.id);
      filters.facilitatorId = { [Op.in]: facilitatorIds };
    }

    // Apply additional filters
    if (courseOfferingId) filters.courseOfferingId = courseOfferingId;
    if (facilitatorId && req.user.type === 'manager') filters.facilitatorId = facilitatorId;
    if (weekNumber) filters.weekNumber = weekNumber;
    if (academicYear) filters.academicYear = academicYear;
    if (trimester) filters.trimester = trimester;
    if (isSubmitted !== undefined) filters.isSubmitted = isSubmitted === 'true';

    // Handle overdue filter
    if (isOverdue === 'true') {
      filters.isSubmitted = false;
      filters.dueDate = { [Op.lt]: new Date() };
    }

    const offset = (page - 1) * limit;

    const { count, rows: activityLogs } = await ActivityTracker.findAndCountAll({
      where: filters,
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            { model: Module, as: 'module' },
            { model: Cohort, as: 'cohort' },
            { model: Class, as: 'class' },
            { model: Mode, as: 'mode' }
          ]
        },
        {
          model: Facilitator,
          as: 'facilitator',
          include: [{ model: User, as: 'user' }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['weekNumber', 'DESC'], ['academicYear', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      activityLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific activity log by ID
exports.getActivityLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const activityLog = await ActivityTracker.findByPk(id, {
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            { model: Module, as: 'module' },
            { model: Cohort, as: 'cohort' },
            { model: Class, as: 'class' },
            { model: Mode, as: 'mode' }
          ]
        },
        {
          model: Facilitator,
          as: 'facilitator',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    if (!activityLog) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    // Check permissions
    if (req.user.type === 'facilitator' && activityLog.facilitatorId !== req.user.facilitatorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.type === 'manager') {
      const facilitator = await Facilitator.findByPk(activityLog.facilitatorId);
      if (!facilitator || facilitator.managerId !== req.user.managerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(activityLog);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update an activity log
exports.updateActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const activityLog = await ActivityTracker.findByPk(id);
    if (!activityLog) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    // Only facilitators can update their own logs
    if (req.user.type !== 'facilitator' || activityLog.facilitatorId !== req.user.facilitatorId) {
      return res.status(403).json({ error: 'Only the assigned facilitator can update this log' });
    }

    // Store previous submission status
    const wasSubmitted = activityLog.isSubmitted;

    // Update the log
    await activityLog.update(updates);

    // Reload with associations
    const updatedLog = await ActivityTracker.findByPk(id, {
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            { model: Module, as: 'module' },
            { model: Manager, as: 'manager' }
          ]
        }
      ]
    });

    // If log was just submitted, notify manager
    if (!wasSubmitted && updatedLog.isSubmitted) {
      const courseOffering = updatedLog.courseOffering;
      await redisService.addSubmissionNotificationJob(
        courseOffering.managerId,
        updatedLog.facilitatorId,
        updatedLog.id
      );
    }

    res.json({
      message: 'Activity log updated successfully',
      activityLog: updatedLog
    });
  } catch (error) {
    console.error('Error updating activity log:', error);
    res.status(400).json({ error: error.message });
  }
};

// Delete an activity log
exports.deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;

    const activityLog = await ActivityTracker.findByPk(id);
    if (!activityLog) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    // Only facilitators can delete their own logs, and only if not submitted
    if (req.user.type !== 'facilitator' || activityLog.facilitatorId !== req.user.facilitatorId) {
      return res.status(403).json({ error: 'Only the assigned facilitator can delete this log' });
    }

    if (activityLog.isSubmitted) {
      return res.status(400).json({ error: 'Cannot delete a submitted activity log' });
    }

    await activityLog.destroy();

    res.json({ message: 'Activity log deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get facilitator's own logs
exports.getMyActivityLogs = async (req, res) => {
  try {
    const facilitatorId = req.user.facilitatorId;
    const {
      courseOfferingId,
      weekNumber,
      academicYear,
      trimester,
      isSubmitted,
      page = 1,
      limit = 10
    } = req.query;

    const filters = { facilitatorId };
    
    if (courseOfferingId) filters.courseOfferingId = courseOfferingId;
    if (weekNumber) filters.weekNumber = weekNumber;
    if (academicYear) filters.academicYear = academicYear;
    if (trimester) filters.trimester = trimester;
    if (isSubmitted !== undefined) filters.isSubmitted = isSubmitted === 'true';

    const offset = (page - 1) * limit;

    const { count, rows: activityLogs } = await ActivityTracker.findAndCountAll({
      where: filters,
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            { model: Module, as: 'module' },
            { model: Cohort, as: 'cohort' },
            { model: Mode, as: 'mode' }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['weekNumber', 'DESC'], ['academicYear', 'DESC'], ['createdAt', 'DESC']]
    });

    // Calculate statistics
    const totalLogs = count;
    const submittedLogs = await ActivityTracker.count({
      where: { ...filters, isSubmitted: true }
    });
    const overdueLogs = await ActivityTracker.count({
      where: {
        ...filters,
        isSubmitted: false,
        dueDate: { [Op.lt]: new Date() }
      }
    });

    res.json({
      activityLogs,
      statistics: {
        totalLogs,
        submittedLogs,
        overdueLogs,
        submissionRate: totalLogs > 0 ? ((submittedLogs / totalLogs) * 100).toFixed(2) : 0
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching facilitator activity logs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get compliance report (Manager only)
exports.getComplianceReport = async (req, res) => {
  try {
    if (req.user.type !== 'manager') {
      return res.status(403).json({ error: 'Only managers can access compliance reports' });
    }

    const {
      facilitatorId,
      courseOfferingId,
      weekNumber,
      academicYear,
      trimester
    } = req.query;

    const filters = {};
    
    // Only show logs for facilitators under this manager
    const managedFacilitators = await Facilitator.findAll({
      where: { managerId: req.user.managerId },
      attributes: ['id']
    });
    const facilitatorIds = managedFacilitators.map(f => f.id);
    filters.facilitatorId = { [Op.in]: facilitatorIds };

    // Apply additional filters
    if (facilitatorId) filters.facilitatorId = facilitatorId;
    if (courseOfferingId) filters.courseOfferingId = courseOfferingId;
    if (weekNumber) filters.weekNumber = weekNumber;
    if (academicYear) filters.academicYear = academicYear;
    if (trimester) filters.trimester = trimester;

    const report = await ActivityTracker.getComplianceReport(filters);

    res.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get overdue logs (Manager only)
exports.getOverdueLogs = async (req, res) => {
  try {
    if (req.user.type !== 'manager') {
      return res.status(403).json({ error: 'Only managers can access overdue logs' });
    }

    // Get all overdue logs for facilitators under this manager
    const managedFacilitators = await Facilitator.findAll({
      where: { managerId: req.user.managerId },
      attributes: ['id']
    });
    const facilitatorIds = managedFacilitators.map(f => f.id);

    const overdueLogs = await ActivityTracker.findAll({
      where: {
        facilitatorId: { [Op.in]: facilitatorIds },
        isSubmitted: false,
        dueDate: { [Op.lt]: new Date() }
      },
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [{ model: Module, as: 'module' }]
        },
        {
          model: Facilitator,
          as: 'facilitator',
          include: [{ model: User, as: 'user' }]
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json({
      overdueLogs,
      count: overdueLogs.length
    });
  } catch (error) {
    console.error('Error fetching overdue logs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bulk create activity logs for a course offering
exports.bulkCreateActivityLogs = async (req, res) => {
  try {
    const { courseOfferingId, startWeek, endWeek, academicYear, trimester } = req.body;
    const facilitatorId = req.user.facilitatorId;

    // Verify the course offering belongs to this facilitator
    const courseOffering = await CourseOffering.findOne({
      where: { id: courseOfferingId, facilitatorId }
    });

    if (!courseOffering) {
      return res.status(403).json({ 
        error: 'You can only create logs for your assigned course offerings' 
      });
    }

    const createdLogs = [];
    const errors = [];

    for (let week = startWeek; week <= endWeek; week++) {
      try {
        // Check if log already exists
        const existingLog = await ActivityTracker.findOne({
          where: {
            courseOfferingId,
            facilitatorId,
            weekNumber: week,
            academicYear,
            trimester
          }
        });

        if (existingLog) {
          errors.push(`Week ${week}: Log already exists`);
          continue;
        }

        // Calculate due date (end of week)
        const now = new Date();
        const dueDate = new Date(now);
        dueDate.setDate(now.getDate() + (7 * (week - 1))); // Approximate week calculation
        dueDate.setHours(23, 59, 59, 999);

        const activityTracker = await ActivityTracker.create({
          id: `AT-${Date.now()}-${week}-${Math.random().toString(36).substr(2, 6)}`,
          courseOfferingId,
          facilitatorId,
          weekNumber: week,
          academicYear,
          trimester,
          attendance: [false, false, false, false, false],
          formativeOneGrading: 'Not Started',
          formativeTwoGrading: 'Not Started',
          summativeGrading: 'Not Started',
          courseModeration: 'Not Started',
          intranetSync: 'Not Started',
          gradeBookStatus: 'Not Started',
          dueDate
        });

        // Schedule reminder notification
        await redisService.addReminderJob(
          facilitatorId,
          activityTracker.id,
          activityTracker.dueDate
        );

        createdLogs.push(activityTracker);
      } catch (error) {
        errors.push(`Week ${week}: ${error.message}`);
      }
    }

    res.status(201).json({
      message: `Bulk creation completed. Created ${createdLogs.length} logs.`,
      createdLogs,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk creating activity logs:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get activity log statistics
exports.getActivityLogStats = async (req, res) => {
  try {
    const { academicYear, trimester } = req.query;
    const filters = {};

    if (academicYear) filters.academicYear = academicYear;
    if (trimester) filters.trimester = trimester;

    // Role-based filtering
    if (req.user.type === 'facilitator') {
      filters.facilitatorId = req.user.facilitatorId;
    } else if (req.user.type === 'manager') {
      const managedFacilitators = await Facilitator.findAll({
        where: { managerId: req.user.managerId },
        attributes: ['id']
      });
      const facilitatorIds = managedFacilitators.map(f => f.id);
      filters.facilitatorId = { [Op.in]: facilitatorIds };
    }

    const [
      totalLogs,
      submittedLogs,
      overdueLogs,
      pendingLogs
    ] = await Promise.all([
      ActivityTracker.count({ where: filters }),
      ActivityTracker.count({ where: { ...filters, isSubmitted: true } }),
      ActivityTracker.count({ 
        where: { 
          ...filters, 
          isSubmitted: false, 
          dueDate: { [Op.lt]: new Date() } 
        } 
      }),
      ActivityTracker.count({ 
        where: { 
          ...filters, 
          isSubmitted: false, 
          dueDate: { [Op.gte]: new Date() } 
        } 
      })
    ]);

    const complianceRate = totalLogs > 0 ? ((submittedLogs / totalLogs) * 100).toFixed(2) : 0;

    res.json({
      totalLogs,
      submittedLogs,
      overdueLogs,
      pendingLogs,
      complianceRate: parseFloat(complianceRate)
    });
  } catch (error) {
    console.error('Error fetching activity log statistics:', error);
    res.status(500).json({ error: error.message });
  }
};