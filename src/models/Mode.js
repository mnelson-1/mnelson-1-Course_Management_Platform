module.exports = (sequelize, DataTypes) => {
  const Mode = sequelize.define('Mode', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM('online', 'in-person', 'hybrid'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  Mode.associate = (models) => {
    // Has many course offerings
    Mode.hasMany(models.CourseOffering, {
      foreignKey: 'modeId',
      as: 'courseOfferings'
    });
  };

  return Mode;
};