module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    graduationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  Class.associate = (models) => {
    // Has many students
    Class.hasMany(models.Student, {
      foreignKey: 'classId',
      as: 'students'
    });

    // Has many course offerings
    Class.hasMany(models.CourseOffering, {
      foreignKey: 'classId',
      as: 'courseOfferings'
    });
  };

  return Class;
};