module.exports = (sequelize, DataTypes) => {
  const Cohort = sequelize.define('Cohort', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  Cohort.associate = (models) => {
    // Has many students
    Cohort.hasMany(models.Student, {
      foreignKey: 'cohortId',
      as: 'students'
    });

    // Has many course offerings
    Cohort.hasMany(models.CourseOffering, {
      foreignKey: 'cohortId',
      as: 'courseOfferings'
    });

    // Can be managed by multiple managers
    Cohort.belongsToMany(models.Manager, {
      through: 'ManagerCohorts',
      foreignKey: 'cohortId',
      otherKey: 'managerId',
      as: 'managers'
    });

    // Can have multiple facilitators through course offerings
    Cohort.belongsToMany(models.Facilitator, {
      through: models.CourseOffering,
      foreignKey: 'cohortId',
      otherKey: 'facilitatorId',
      as: 'facilitators'
    });
  };

  return Cohort;
};