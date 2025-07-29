module.exports = (sequelize, DataTypes) => {
  const CourseOffering = sequelize.define('CourseOffering', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    moduleId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Modules',
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
    managerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Managers',
        key: 'id'
      }
    },
    cohortId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Cohorts',
        key: 'id'
      }
    },
    classId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Classes',
        key: 'id'
      }
    },
    modeId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Modes',
        key: 'id'
      }
    },
    trimester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 3
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2030
      }
    },
    intakePeriod: {
      type: DataTypes.ENUM('HT1', 'HT2', 'FT'),
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    currentEnrollment: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('planned', 'active', 'completed', 'cancelled'),
      defaultValue: 'planned'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    indexes: [
      {
        unique: true,
        name: 'unique_course_offering',
        fields: ['moduleId', 'facilitatorId', 'cohortId', 'trimester', 'year', 'intakePeriod']
      },
      {
        name: 'idx_trimester_year',
        fields: ['trimester', 'year']
      },
      {
        name: 'idx_facilitator',
        fields: ['facilitatorId']
      },
      {
        name: 'idx_manager',
        fields: ['managerId']
      },
      {
        name: 'idx_cohort',
        fields: ['cohortId']
      },
      {
        name: 'idx_intake',
        fields: ['intakePeriod']
      },
      {
        name: 'idx_status',
        fields: ['status']
      }
    ]
  });

  CourseOffering.associate = (models) => {
    // Belongs to Module
    CourseOffering.belongsTo(models.Module, {
      foreignKey: 'moduleId',
      as: 'module'
    });

    // Belongs to Facilitator
    CourseOffering.belongsTo(models.Facilitator, {
      foreignKey: 'facilitatorId',
      as: 'facilitator'
    });

    // Belongs to Manager (who created the allocation)
    CourseOffering.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager'
    });

    // Belongs to Cohort
    CourseOffering.belongsTo(models.Cohort, {
      foreignKey: 'cohortId',
      as: 'cohort'
    });

    // Belongs to Class
    CourseOffering.belongsTo(models.Class, {
      foreignKey: 'classId',
      as: 'class'
    });

    // Belongs to Mode
    CourseOffering.belongsTo(models.Mode, {
      foreignKey: 'modeId',
      as: 'mode'
    });

    // Has many enrolled students through junction table
    CourseOffering.belongsToMany(models.Student, {
      through: 'StudentEnrollments',
      foreignKey: 'courseOfferingId',
      otherKey: 'studentId',
      as: 'enrolledStudents'
    });

    // Has many activity trackers (Module 2)
    CourseOffering.hasMany(models.ActivityTracker, {
      foreignKey: 'courseOfferingId',
      as: 'activityTrackers'
    });
  };

  // Instance methods
  CourseOffering.prototype.canEnrollStudent = function() {
    return this.currentEnrollment < this.maxStudents && this.status === 'active';
  };

  CourseOffering.prototype.getEnrollmentStatus = function() {
    const percentage = (this.currentEnrollment / this.maxStudents) * 100;
    if (percentage >= 100) return 'full';
    if (percentage >= 80) return 'nearly_full';
    if (percentage >= 50) return 'half_full';
    return 'available';
  };

  // Class methods
  CourseOffering.findByFilters = function(filters = {}) {
    const where = {};
    
    if (filters.trimester) where.trimester = filters.trimester;
    if (filters.year) where.year = filters.year;
    if (filters.cohortId) where.cohortId = filters.cohortId;
    if (filters.facilitatorId) where.facilitatorId = filters.facilitatorId;
    if (filters.managerId) where.managerId = filters.managerId;
    if (filters.intakePeriod) where.intakePeriod = filters.intakePeriod;
    if (filters.modeId) where.modeId = filters.modeId;
    if (filters.status) where.status = filters.status;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return this.findAll({
      where,
      include: [
        { model: sequelize.models.Module, as: 'module' },
        { model: sequelize.models.Facilitator, as: 'facilitator', include: [{ model: sequelize.models.User, as: 'user' }] },
        { model: sequelize.models.Manager, as: 'manager', include: [{ model: sequelize.models.User, as: 'user' }] },
        { model: sequelize.models.Cohort, as: 'cohort' },
        { model: sequelize.models.Class, as: 'class' },
        { model: sequelize.models.Mode, as: 'mode' }
      ],
      order: [['year', 'DESC'], ['trimester', 'DESC'], ['startDate', 'ASC']]
    });
  };

  return CourseOffering;
};