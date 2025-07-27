module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Cohort', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};