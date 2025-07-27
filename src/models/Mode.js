module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Mode', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM('online', 'in-person', 'hybrid'),
      allowNull: false,
    },
  });
};