module.exports = (sequelize, DataTypes) => {
  const Module = sequelize.define("Module", {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    half: {
      type: DataTypes.ENUM("H1", "H2"),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  Module.associate = (models) => {
    // Has many course offerings
    Module.hasMany(models.CourseOffering, {
      foreignKey: 'moduleId',
      as: 'courseOfferings'
    });

    // Can be taught by multiple facilitators through course offerings
    Module.belongsToMany(models.Facilitator, {
      through: models.CourseOffering,
      foreignKey: 'moduleId',
      otherKey: 'facilitatorId',
      as: 'facilitators'
    });

    // Can be offered to multiple cohorts through course offerings
    Module.belongsToMany(models.Cohort, {
      through: models.CourseOffering,
      foreignKey: 'moduleId',
      otherKey: 'cohortId',
      as: 'cohorts'
    });
  };

  return Module;
};
