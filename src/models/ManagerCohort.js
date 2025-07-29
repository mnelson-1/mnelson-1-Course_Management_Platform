module.exports = (sequelize, DataTypes) => {
  const ManagerCohort = sequelize.define('ManagerCohort', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    managerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Managers',
        key: 'id'
      }
    },
    cohortId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Cohorts',
        key: 'id'
      }
    },
    assignedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    role: {
      type: DataTypes.ENUM('primary', 'secondary', 'observer'),
      defaultValue: 'primary'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['managerId', 'cohortId']
      },
      {
        fields: ['role']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  ManagerCohort.associate = (models) => {
    // Belongs to Manager
    ManagerCohort.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager'
    });

    // Belongs to Cohort
    ManagerCohort.belongsTo(models.Cohort, {
      foreignKey: 'cohortId',
      as: 'cohort'
    });
  };

  return ManagerCohort;
};