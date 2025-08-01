const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID, // or DataTypes.INTEGER
        defaultValue: DataTypes.UUIDV4, // or autoIncrement: true for integers
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        // Discriminator field
        type: DataTypes.ENUM("manager", "facilitator", "student"),
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      hooks: {
        beforeCreate: async (user) => {
          user.password = await bcrypt.hash(user.password, 10);
        },
      },
    }
  );

  User.associate = (models) => {
    // One-to-one relationships with role-specific models
    User.hasOne(models.Manager, {
      foreignKey: "userId",
      as: "managerProfile",
      constraints: false,
    });

    User.hasOne(models.Facilitator, {
      foreignKey: "userId",
      as: "facilitatorProfile",
      constraints: false,
    });

    User.hasOne(models.Student, {
      foreignKey: "userId",
      as: "studentProfile",
      constraints: false,
    });
  };

  return User;
};
