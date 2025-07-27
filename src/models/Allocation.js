module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Allocation', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    trimester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 3 },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
};