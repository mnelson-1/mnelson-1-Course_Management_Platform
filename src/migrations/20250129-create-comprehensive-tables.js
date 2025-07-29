'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Users table first (base table for all user types)
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('manager', 'facilitator', 'student'),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Managers table
    await queryInterface.createTable('Managers', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false
      },
      hireDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Facilitators table
    await queryInterface.createTable('Facilitators', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      managerId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Managers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      qualification: {
        type: Sequelize.STRING,
        allowNull: false
      },
      specialization: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      hireDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Classes table
    await queryInterface.createTable('Classes', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      semester: {
        type: Sequelize.STRING,
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      graduationDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Cohorts table
    await queryInterface.createTable('Cohorts', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      maxStudents: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Students table
    await queryInterface.createTable('Students', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cohortId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Cohorts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      classId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      studentId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      admissionYear: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      admissionDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'graduated', 'suspended'),
        defaultValue: 'active'
      },
      intakePeriod: {
        type: Sequelize.ENUM('HT1', 'HT2', 'FT'),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Modules table
    await queryInterface.createTable('Modules', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3
      },
      half: {
        type: Sequelize.ENUM('H1', 'H2'),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create Modes table
    await queryInterface.createTable('Modes', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.ENUM('online', 'in-person', 'hybrid'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create CourseOfferings table (main allocation table)
    await queryInterface.createTable('CourseOfferings', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      moduleId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Modules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      facilitatorId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Facilitators',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      managerId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Managers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cohortId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Cohorts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      classId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      modeId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Modes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      trimester: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 3
        }
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 2020,
          max: 2030
        }
      },
      intakePeriod: {
        type: Sequelize.ENUM('HT1', 'HT2', 'FT'),
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      maxStudents: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      currentEnrollment: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('planned', 'active', 'completed', 'cancelled'),
        defaultValue: 'planned'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create StudentEnrollments junction table
    await queryInterface.createTable('StudentEnrollments', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      studentId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      courseOfferingId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'CourseOfferings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      enrollmentDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: Sequelize.ENUM('enrolled', 'completed', 'withdrawn', 'failed'),
        defaultValue: 'enrolled'
      },
      finalGrade: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      attendance: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        }
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create ManagerCohorts junction table
    await queryInterface.createTable('ManagerCohorts', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      managerId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Managers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cohortId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Cohorts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      role: {
        type: Sequelize.ENUM('primary', 'secondary', 'observer'),
        defaultValue: 'primary'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('CourseOfferings', ['moduleId', 'facilitatorId', 'cohortId', 'trimester', 'year', 'intakePeriod'], {
      unique: true,
      name: 'unique_course_offering'
    });
    
    await queryInterface.addIndex('CourseOfferings', ['trimester', 'year']);
    await queryInterface.addIndex('CourseOfferings', ['facilitatorId']);
    await queryInterface.addIndex('CourseOfferings', ['managerId']);
    await queryInterface.addIndex('CourseOfferings', ['cohortId']);
    await queryInterface.addIndex('CourseOfferings', ['intakePeriod']);
    await queryInterface.addIndex('CourseOfferings', ['status']);

    await queryInterface.addIndex('StudentEnrollments', ['studentId', 'courseOfferingId'], {
      unique: true,
      name: 'unique_student_enrollment'
    });
    
    await queryInterface.addIndex('StudentEnrollments', ['status']);
    await queryInterface.addIndex('StudentEnrollments', ['enrollmentDate']);

    await queryInterface.addIndex('ManagerCohorts', ['managerId', 'cohortId'], {
      unique: true,
      name: 'unique_manager_cohort'
    });
    
    await queryInterface.addIndex('ManagerCohorts', ['role']);
    await queryInterface.addIndex('ManagerCohorts', ['isActive']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable('ManagerCohorts');
    await queryInterface.dropTable('StudentEnrollments');
    await queryInterface.dropTable('CourseOfferings');
    await queryInterface.dropTable('Modes');
    await queryInterface.dropTable('Modules');
    await queryInterface.dropTable('Students');
    await queryInterface.dropTable('Cohorts');
    await queryInterface.dropTable('Classes');
    await queryInterface.dropTable('Facilitators');
    await queryInterface.dropTable('Managers');
    await queryInterface.dropTable('Users');
  }
};