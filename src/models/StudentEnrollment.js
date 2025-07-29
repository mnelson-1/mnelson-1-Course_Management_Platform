module.exports = (sequelize, DataTypes) => {
  const StudentEnrollment = sequelize.define('StudentEnrollment', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Students',
        key: 'id'
      }
    },
    courseOfferingId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'CourseOfferings',
        key: 'id'
      }
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('enrolled', 'completed', 'withdrawn', 'failed'),
      defaultValue: 'enrolled'
    },
    finalGrade: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    attendance: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'courseOfferingId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['enrollmentDate']
      }
    ]
  });

  StudentEnrollment.associate = (models) => {
    // Belongs to Student
    StudentEnrollment.belongsTo(models.Student, {
      foreignKey: 'studentId',
      as: 'student'
    });

    // Belongs to CourseOffering
    StudentEnrollment.belongsTo(models.CourseOffering, {
      foreignKey: 'courseOfferingId',
      as: 'courseOffering'
    });
  };

  return StudentEnrollment;
};