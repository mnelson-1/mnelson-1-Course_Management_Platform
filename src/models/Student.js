module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
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
    classId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Classes',
        key: 'id'
      }
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    admissionYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    admissionDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
      defaultValue: 'active'
    },
    intakePeriod: {
      type: DataTypes.ENUM('HT1', 'HT2', 'FT'),
      allowNull: false
    }
  });

  Student.associate = (models) => {
    // Belongs to User
    Student.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Belongs to Cohort
    Student.belongsTo(models.Cohort, {
      foreignKey: 'cohortId',
      as: 'cohort'
    });

    // Belongs to Class
    Student.belongsTo(models.Class, {
      foreignKey: 'classId',
      as: 'class'
    });

    // Can be enrolled in multiple course offerings
    Student.belongsToMany(models.CourseOffering, {
      through: 'StudentEnrollments',
      foreignKey: 'studentId',
      otherKey: 'courseOfferingId',
      as: 'enrolledCourses'
    });
  };

  return Student;
};