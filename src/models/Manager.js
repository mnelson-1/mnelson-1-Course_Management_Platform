module.exports = (sequelize, DataTypes) => {
  const Manager = sequelize.define('Manager', {
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
    department: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
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

  Manager.associate = (models) => {
    // Belongs to User
    Manager.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Has many facilitators
    Manager.hasMany(models.Facilitator, {
      foreignKey: 'managerId',
      as: 'facilitators'
    });

    // Has many course offerings through facilitators
    Manager.hasMany(models.CourseOffering, {
      foreignKey: 'managerId',
      as: 'managedCourseOfferings'
    });

    // Can manage multiple cohorts
    Manager.belongsToMany(models.Cohort, {
      through: 'ManagerCohorts',
      foreignKey: 'managerId',
      otherKey: 'cohortId',
      as: 'managedCohorts'
    });
  };

  return Manager;
};