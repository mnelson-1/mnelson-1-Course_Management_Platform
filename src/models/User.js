const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {  // Discriminator field
      type: DataTypes.ENUM('manager', 'facilitator', 'student'),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  });

  User.associate = (models) => {
    // One-to-one relationships with role-specific models
    User.hasOne(models.Manager, {
      foreignKey: 'userId',
      as: 'managerProfile',
      constraints: false,
      scope: {
        type: 'manager'
      }
    });

    User.hasOne(models.Facilitator, {
      foreignKey: 'userId',
      as: 'facilitatorProfile',
      constraints: false,
      scope: {
        type: 'facilitator'
      }
    });

    User.hasOne(models.Student, {
      foreignKey: 'userId',
      as: 'studentProfile',
      constraints: false,
      scope: {
        type: 'student'
      }
    });
  };

  return User;
};