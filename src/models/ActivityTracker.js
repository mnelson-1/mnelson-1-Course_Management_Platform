module.exports = (sequelize, DataTypes) => {
  const ActivityTracker = sequelize.define('ActivityTracker', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    courseOfferingId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'CourseOfferings',
        key: 'id'
      }
    },
    facilitatorId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Facilitators',
        key: 'id'
      }
    },
    weekNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 52
      }
    },
    academicYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    trimester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 3
      }
    },
    // Attendance tracking - array of boolean values for daily attendance
    attendance: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [false, false, false, false, false], // Mon-Fri
      validate: {
        isValidAttendance(value) {
          if (!Array.isArray(value)) {
            throw new Error('Attendance must be an array');
          }
          if (value.length !== 5) {
            throw new Error('Attendance array must have exactly 5 elements (Mon-Fri)');
          }
          if (!value.every(day => typeof day === 'boolean')) {
            throw new Error('All attendance values must be boolean');
          }
        }
      }
    },
    // Formative Assessment 1 Grading Status
    formativeOneGrading: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started'
    },
    // Formative Assessment 2 Grading Status
    formativeTwoGrading: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started'
    },
    // Summative Assessment Grading Status
    summativeGrading: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started'
    },
    // Course Moderation Status
    courseModeration: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started'
    },
    // Intranet Synchronization Status
    intranetSync: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started'
    },
    // Gradebook Status
    gradeBookStatus: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started'
    },
    // Submission tracking
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isSubmitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Deadline tracking
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isOverdue: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.isSubmitted && this.dueDate) {
          return new Date() > this.dueDate;
        }
        return false;
      }
    },
    // Completion percentage
    completionPercentage: {
      type: DataTypes.VIRTUAL,
      get() {
        const tasks = [
          this.formativeOneGrading,
          this.formativeTwoGrading,
          this.summativeGrading,
          this.courseModeration,
          this.intranetSync,
          this.gradeBookStatus
        ];
        
        const attendanceComplete = this.attendance && this.attendance.some(day => day === true);
        const completedTasks = tasks.filter(task => task === 'Done').length;
        const totalTasks = tasks.length + (attendanceComplete ? 1 : 0);
        
        return totalTasks > 0 ? Math.round((completedTasks / (tasks.length + 1)) * 100) : 0;
      }
    },
    // Additional notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Notification tracking
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reminderSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    overdueAlertSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    overdueAlertSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    indexes: [
      {
        unique: true,
        name: 'unique_weekly_log',
        fields: ['courseOfferingId', 'facilitatorId', 'weekNumber', 'academicYear', 'trimester']
      },
      {
        name: 'idx_facilitator_week',
        fields: ['facilitatorId', 'weekNumber', 'academicYear']
      },
      {
        name: 'idx_course_week',
        fields: ['courseOfferingId', 'weekNumber']
      },
      {
        name: 'idx_due_date',
        fields: ['dueDate']
      },
      {
        name: 'idx_submission_status',
        fields: ['isSubmitted', 'dueDate']
      },
      {
        name: 'idx_notification_tracking',
        fields: ['reminderSent', 'overdueAlertSent', 'dueDate']
      }
    ],
    hooks: {
      beforeCreate: (activityTracker) => {
        // Generate ID if not provided
        if (!activityTracker.id) {
          activityTracker.id = `AT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set due date if not provided (default to end of week)
        if (!activityTracker.dueDate) {
          const now = new Date();
          const endOfWeek = new Date(now);
          endOfWeek.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
          endOfWeek.setHours(23, 59, 59, 999);
          activityTracker.dueDate = endOfWeek;
        }
      },
      beforeUpdate: (activityTracker) => {
        // Update submission status and timestamp
        const tasks = [
          activityTracker.formativeOneGrading,
          activityTracker.formativeTwoGrading,
          activityTracker.summativeGrading,
          activityTracker.courseModeration,
          activityTracker.intranetSync,
          activityTracker.gradeBookStatus
        ];
        
        const attendanceComplete = activityTracker.attendance && 
          activityTracker.attendance.some(day => day === true);
        
        const allTasksComplete = tasks.every(task => task === 'Done') && attendanceComplete;
        
        if (allTasksComplete && !activityTracker.isSubmitted) {
          activityTracker.isSubmitted = true;
          activityTracker.submittedAt = new Date();
        } else if (!allTasksComplete && activityTracker.isSubmitted) {
          activityTracker.isSubmitted = false;
          activityTracker.submittedAt = null;
        }
      }
    }
  });

  ActivityTracker.associate = (models) => {
    // Belongs to CourseOffering
    ActivityTracker.belongsTo(models.CourseOffering, {
      foreignKey: 'courseOfferingId',
      as: 'courseOffering'
    });

    // Belongs to Facilitator
    ActivityTracker.belongsTo(models.Facilitator, {
      foreignKey: 'facilitatorId',
      as: 'facilitator'
    });
  };

  // Class methods for reporting and analytics
  ActivityTracker.getComplianceReport = async function(filters = {}) {
    const where = {};
    
    if (filters.facilitatorId) where.facilitatorId = filters.facilitatorId;
    if (filters.courseOfferingId) where.courseOfferingId = filters.courseOfferingId;
    if (filters.weekNumber) where.weekNumber = filters.weekNumber;
    if (filters.academicYear) where.academicYear = filters.academicYear;
    if (filters.trimester) where.trimester = filters.trimester;

    const logs = await this.findAll({
      where,
      include: [
        { 
          model: sequelize.models.CourseOffering, 
          as: 'courseOffering',
          include: [
            { model: sequelize.models.Module, as: 'module' },
            { model: sequelize.models.Cohort, as: 'cohort' }
          ]
        },
        { 
          model: sequelize.models.Facilitator, 
          as: 'facilitator',
          include: [{ model: sequelize.models.User, as: 'user' }]
        }
      ],
      order: [['weekNumber', 'DESC'], ['dueDate', 'DESC']]
    });

    // Calculate compliance statistics
    const totalLogs = logs.length;
    const submittedLogs = logs.filter(log => log.isSubmitted).length;
    const overdueLogs = logs.filter(log => log.isOverdue).length;
    const onTimeLogs = logs.filter(log => log.isSubmitted && log.submittedAt <= log.dueDate).length;

    return {
      logs,
      statistics: {
        totalLogs,
        submittedLogs,
        overdueLogs,
        onTimeLogs,
        complianceRate: totalLogs > 0 ? ((submittedLogs / totalLogs) * 100).toFixed(2) : 0,
        onTimeRate: totalLogs > 0 ? ((onTimeLogs / totalLogs) * 100).toFixed(2) : 0
      }
    };
  };

  ActivityTracker.getOverdueLogs = async function() {
    return await this.findAll({
      where: {
        isSubmitted: false,
        dueDate: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      },
      include: [
        { 
          model: sequelize.models.CourseOffering, 
          as: 'courseOffering',
          include: [{ model: sequelize.models.Module, as: 'module' }]
        },
        { 
          model: sequelize.models.Facilitator, 
          as: 'facilitator',
          include: [{ model: sequelize.models.User, as: 'user' }]
        }
      ],
      order: [['dueDate', 'ASC']]
    });
  };

  ActivityTracker.getPendingReminders = async function() {
    const reminderThreshold = new Date();
    reminderThreshold.setHours(reminderThreshold.getHours() + 24); // 24 hours before due

    return await this.findAll({
      where: {
        isSubmitted: false,
        reminderSent: false,
        dueDate: {
          [sequelize.Sequelize.Op.lte]: reminderThreshold,
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      },
      include: [
        { 
          model: sequelize.models.CourseOffering, 
          as: 'courseOffering',
          include: [{ model: sequelize.models.Module, as: 'module' }]
        },
        { 
          model: sequelize.models.Facilitator, 
          as: 'facilitator',
          include: [{ model: sequelize.models.User, as: 'user' }]
        }
      ]
    });
  };

  return ActivityTracker;
};