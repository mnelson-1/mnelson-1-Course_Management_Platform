module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Module", {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    half: {
      type: DataTypes.ENUM("H1", "H2"),
      allowNull: false,
    },
  });
};
