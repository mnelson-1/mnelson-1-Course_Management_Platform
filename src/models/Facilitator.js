module.exports = (sequelize, DataTypes) => {
  const Facilitator = sequelize.define('Facilitator', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
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
    qualification: {
      type: DataTypes.STRING,
      allowNull: false
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  Facilitator.associate = (models) => {
    // Belongs to User
    Facilitator.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Belongs to Manager
    Facilitator.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager'
    });

    // Has many course offerings
    Facilitator.hasMany(models.CourseOffering, {
      foreignKey: 'facilitatorId',
      as: 'courseOfferings'
    });

    // Can teach multiple modules through course offerings
    Facilitator.belongsToMany(models.Module, {
      through: models.CourseOffering,
      foreignKey: 'facilitatorId',
      otherKey: 'moduleId',
      as: 'assignedModules'
    });

    // Can work with multiple cohorts through course offerings
    Facilitator.belongsToMany(models.Cohort, {
      through: models.CourseOffering,
      foreignKey: 'facilitatorId',
      otherKey: 'cohortId',
      as: 'assignedCohorts'
    });

    // Has many activity trackers (Module 2)
    Facilitator.hasMany(models.ActivityTracker, {
      foreignKey: 'facilitatorId',
      as: 'activityTrackers'
    });
  };

  return Facilitator;
};