'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Create Users
    const users = [
      // Managers
      {
        id: 'user-mgr-001',
        email: 'john.manager@university.edu',
        password: await bcrypt.hash('Manager123!', 10),
        firstName: 'John',
        lastName: 'Manager',
        type: 'manager',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-mgr-002',
        email: 'sarah.director@university.edu',
        password: await bcrypt.hash('Director123!', 10),
        firstName: 'Sarah',
        lastName: 'Director',
        type: 'manager',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      // Facilitators
      {
        id: 'user-fac-001',
        email: 'alice.smith@university.edu',
        password: await bcrypt.hash('Facilitator123!', 10),
        firstName: 'Alice',
        lastName: 'Smith',
        type: 'facilitator',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-fac-002',
        email: 'bob.johnson@university.edu',
        password: await bcrypt.hash('Facilitator123!', 10),
        firstName: 'Bob',
        lastName: 'Johnson',
        type: 'facilitator',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-fac-003',
        email: 'carol.williams@university.edu',
        password: await bcrypt.hash('Facilitator123!', 10),
        firstName: 'Carol',
        lastName: 'Williams',
        type: 'facilitator',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-fac-004',
        email: 'david.brown@university.edu',
        password: await bcrypt.hash('Facilitator123!', 10),
        firstName: 'David',
        lastName: 'Brown',
        type: 'facilitator',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      // Students
      {
        id: 'user-std-001',
        email: 'emma.student@student.university.edu',
        password: await bcrypt.hash('Student123!', 10),
        firstName: 'Emma',
        lastName: 'Student',
        type: 'student',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-std-002',
        email: 'james.learner@student.university.edu',
        password: await bcrypt.hash('Student123!', 10),
        firstName: 'James',
        lastName: 'Learner',
        type: 'student',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-std-003',
        email: 'sophia.scholar@student.university.edu',
        password: await bcrypt.hash('Student123!', 10),
        firstName: 'Sophia',
        lastName: 'Scholar',
        type: 'student',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-std-004',
        email: 'michael.pupil@student.university.edu',
        password: await bcrypt.hash('Student123!', 10),
        firstName: 'Michael',
        lastName: 'Pupil',
        type: 'student',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-std-005',
        email: 'olivia.academic@student.university.edu',
        password: await bcrypt.hash('Student123!', 10),
        firstName: 'Olivia',
        lastName: 'Academic',
        type: 'student',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Users', users);

    // Create Managers
    const managers = [
      {
        id: 'mgr-001',
        userId: 'user-mgr-001',
        department: 'Computer Science',
        position: 'Academic Manager',
        hireDate: new Date('2020-01-15'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mgr-002',
        userId: 'user-mgr-002',
        department: 'Engineering',
        position: 'Program Director',
        hireDate: new Date('2019-08-01'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Managers', managers);

    // Create Facilitators
    const facilitators = [
      {
        id: 'fac-001',
        userId: 'user-fac-001',
        managerId: 'mgr-001',
        qualification: 'PhD in Computer Science',
        specialization: 'Software Engineering',
        location: 'Campus A',
        hireDate: new Date('2021-03-01'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'fac-002',
        userId: 'user-fac-002',
        managerId: 'mgr-001',
        qualification: 'MSc in Data Science',
        specialization: 'Machine Learning',
        location: 'Campus A',
        hireDate: new Date('2021-06-15'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'fac-003',
        userId: 'user-fac-003',
        managerId: 'mgr-002',
        qualification: 'PhD in Engineering',
        specialization: 'Systems Engineering',
        location: 'Campus B',
        hireDate: new Date('2020-09-01'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'fac-004',
        userId: 'user-fac-004',
        managerId: 'mgr-002',
        qualification: 'MSc in Project Management',
        specialization: 'Agile Methodologies',
        location: 'Campus B',
        hireDate: new Date('2022-01-10'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Facilitators', facilitators);

    // Create Classes
    const classes = [
      {
        id: 'class-2024s',
        name: '2024 Spring Intake',
        year: 2024,
        semester: 'Spring',
        startDate: new Date('2024-01-15'),
        graduationDate: new Date('2026-12-15'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'class-2024f',
        name: '2024 Fall Intake',
        year: 2024,
        semester: 'Fall',
        startDate: new Date('2024-08-15'),
        graduationDate: new Date('2027-05-15'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'class-2025s',
        name: '2025 Spring Intake',
        year: 2025,
        semester: 'Spring',
        startDate: new Date('2025-01-15'),
        graduationDate: new Date('2027-12-15'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Classes', classes);

    // Create Cohorts
    const cohorts = [
      {
        id: 'cohort-cs-2024',
        name: 'Computer Science 2024',
        description: 'Computer Science cohort for 2024 intake',
        maxStudents: 30,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2026-12-15'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cohort-eng-2024',
        name: 'Engineering 2024',
        description: 'Engineering cohort for 2024 intake',
        maxStudents: 25,
        startDate: new Date('2024-08-15'),
        endDate: new Date('2027-05-15'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cohort-cs-2025',
        name: 'Computer Science 2025',
        description: 'Computer Science cohort for 2025 intake',
        maxStudents: 35,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2027-12-15'),
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Cohorts', cohorts);

    // Create Students
    const students = [
      {
        id: 'std-001',
        userId: 'user-std-001',
        cohortId: 'cohort-cs-2024',
        classId: 'class-2024s',
        studentId: 'CS2024001',
        admissionYear: 2024,
        admissionDate: new Date('2024-01-15'),
        status: 'active',
        intakePeriod: 'HT1',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'std-002',
        userId: 'user-std-002',
        cohortId: 'cohort-cs-2024',
        classId: 'class-2024s',
        studentId: 'CS2024002',
        admissionYear: 2024,
        admissionDate: new Date('2024-01-15'),
        status: 'active',
        intakePeriod: 'HT1',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'std-003',
        userId: 'user-std-003',
        cohortId: 'cohort-eng-2024',
        classId: 'class-2024f',
        studentId: 'ENG2024001',
        admissionYear: 2024,
        admissionDate: new Date('2024-08-15'),
        status: 'active',
        intakePeriod: 'FT',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'std-004',
        userId: 'user-std-004',
        cohortId: 'cohort-eng-2024',
        classId: 'class-2024f',
        studentId: 'ENG2024002',
        admissionYear: 2024,
        admissionDate: new Date('2024-08-15'),
        status: 'active',
        intakePeriod: 'FT',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'std-005',
        userId: 'user-std-005',
        cohortId: 'cohort-cs-2025',
        classId: 'class-2025s',
        studentId: 'CS2025001',
        admissionYear: 2025,
        admissionDate: new Date('2025-01-15'),
        status: 'active',
        intakePeriod: 'HT2',
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Students', students);

    // Create Modules
    const modules = [
      {
        id: 'mod-cs101',
        name: 'Introduction to Programming',
        code: 'CS101',
        description: 'Basic programming concepts and fundamentals',
        credits: 4,
        half: 'H1',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mod-cs102',
        name: 'Data Structures and Algorithms',
        code: 'CS102',
        description: 'Advanced data structures and algorithmic thinking',
        credits: 4,
        half: 'H2',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mod-cs201',
        name: 'Database Systems',
        code: 'CS201',
        description: 'Database design and management systems',
        credits: 3,
        half: 'H1',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mod-cs202',
        name: 'Web Development',
        code: 'CS202',
        description: 'Modern web development technologies',
        credits: 3,
        half: 'H2',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mod-eng101',
        name: 'Engineering Mathematics',
        code: 'ENG101',
        description: 'Mathematical foundations for engineering',
        credits: 4,
        half: 'H1',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mod-eng102',
        name: 'Systems Design',
        code: 'ENG102',
        description: 'Principles of systems engineering and design',
        credits: 4,
        half: 'H2',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Modules', modules);

    // Create Modes
    const modes = [
      {
        id: 'mode-online',
        name: 'online',
        description: 'Fully online delivery mode',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mode-inperson',
        name: 'in-person',
        description: 'Traditional face-to-face delivery',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mode-hybrid',
        name: 'hybrid',
        description: 'Combination of online and in-person delivery',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Modes', modes);

    // Create Course Offerings
    const courseOfferings = [
      {
        id: 'co-001',
        moduleId: 'mod-cs101',
        facilitatorId: 'fac-001',
        managerId: 'mgr-001',
        cohortId: 'cohort-cs-2024',
        classId: 'class-2024s',
        modeId: 'mode-hybrid',
        trimester: 1,
        year: 2024,
        intakePeriod: 'HT1',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-04-15'),
        maxStudents: 30,
        currentEnrollment: 2,
        status: 'completed',
        location: 'Room A101',
        notes: 'Introductory course for new students',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'co-002',
        moduleId: 'mod-cs102',
        facilitatorId: 'fac-001',
        managerId: 'mgr-001',
        cohortId: 'cohort-cs-2024',
        classId: 'class-2024s',
        modeId: 'mode-inperson',
        trimester: 2,
        year: 2024,
        intakePeriod: 'HT1',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-08-01'),
        maxStudents: 30,
        currentEnrollment: 2,
        status: 'completed',
        location: 'Room A102',
        notes: 'Advanced programming concepts',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'co-003',
        moduleId: 'mod-cs201',
        facilitatorId: 'fac-002',
        managerId: 'mgr-001',
        cohortId: 'cohort-cs-2024',
        classId: 'class-2024s',
        modeId: 'mode-online',
        trimester: 3,
        year: 2024,
        intakePeriod: 'HT1',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-01'),
        maxStudents: 30,
        currentEnrollment: 2,
        status: 'active',
        location: 'Online Platform',
        notes: 'Database fundamentals',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'co-004',
        moduleId: 'mod-eng101',
        facilitatorId: 'fac-003',
        managerId: 'mgr-002',
        cohortId: 'cohort-eng-2024',
        classId: 'class-2024f',
        modeId: 'mode-inperson',
        trimester: 1,
        year: 2024,
        intakePeriod: 'FT',
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-11-15'),
        maxStudents: 25,
        currentEnrollment: 2,
        status: 'completed',
        location: 'Room B201',
        notes: 'Mathematical foundations',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'co-005',
        moduleId: 'mod-eng102',
        facilitatorId: 'fac-004',
        managerId: 'mgr-002',
        cohortId: 'cohort-eng-2024',
        classId: 'class-2024f',
        modeId: 'mode-hybrid',
        trimester: 2,
        year: 2025,
        intakePeriod: 'FT',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-04-15'),
        maxStudents: 25,
        currentEnrollment: 2,
        status: 'active',
        location: 'Room B202',
        notes: 'Systems design principles',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'co-006',
        moduleId: 'mod-cs101',
        facilitatorId: 'fac-001',
        managerId: 'mgr-001',
        cohortId: 'cohort-cs-2025',
        classId: 'class-2025s',
        modeId: 'mode-hybrid',
        trimester: 1,
        year: 2025,
        intakePeriod: 'HT2',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-04-15'),
        maxStudents: 35,
        currentEnrollment: 1,
        status: 'active',
        location: 'Room A103',
        notes: 'Programming fundamentals for 2025 cohort',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('CourseOfferings', courseOfferings);

    // Create Student Enrollments
    const studentEnrollments = [
      // CS 2024 students
      {
        id: 'se-001',
        studentId: 'std-001',
        courseOfferingId: 'co-001',
        enrollmentDate: new Date('2024-01-15'),
        status: 'completed',
        finalGrade: 85.5,
        attendance: 95.0,
        notes: 'Excellent performance in first course',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'se-002',
        studentId: 'std-001',
        courseOfferingId: 'co-002',
        enrollmentDate: new Date('2024-05-01'),
        status: 'completed',
        finalGrade: 78.0,
        attendance: 88.0,
        notes: 'Good understanding of algorithms',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'se-003',
        studentId: 'std-001',
        courseOfferingId: 'co-003',
        enrollmentDate: new Date('2024-09-01'),
        status: 'enrolled',
        finalGrade: null,
        attendance: 92.0,
        notes: 'Currently enrolled in database course',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'se-004',
        studentId: 'std-002',
        courseOfferingId: 'co-001',
        enrollmentDate: new Date('2024-01-15'),
        status: 'completed',
        finalGrade: 92.0,
        attendance: 98.0,
        notes: 'Outstanding student performance',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'se-005',
        studentId: 'std-002',
        courseOfferingId: 'co-002',
        enrollmentDate: new Date('2024-05-01'),
        status: 'completed',
        finalGrade: 89.5,
        attendance: 95.0,
        notes: 'Strong algorithmic thinking',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'se-006',
        studentId: 'std-002',
        courseOfferingId: 'co-003',
        enrollmentDate: new Date('2024-09-01'),
        status: 'enrolled',
        finalGrade: null,
        attendance: 96.0,
        notes: 'Excellent participation in database course',
        createdAt: now,
        updatedAt: now
      },
      // Engineering 2024 students
      {
        id: 'se-007',
        studentId: 'std-003',
        courseOfferingId: 'co-004',
        enrollmentDate: new Date('2024-08-15'),
        status: 'completed',
        finalGrade: 81.0,
        attendance: 90.0,
        notes: 'Good grasp of mathematical concepts',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'se-008',
        studentId: 'std-003',
        courseOfferingId: 'co-005',
        enrollmentDate: new Date('2025-01-15'),
        status: 'enrolled',
        finalGrade: null,
        attendance: 85.0,
        notes: 'Currently learning systems design',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'se-009',
        studentId: 'std-004',
        courseOfferingId: 'co-004',
        enrollmentDate: new Date('2024-08-15'),
        status: 'completed',
        finalGrade: 76.5,
        attendance: 82.0,
        notes: 'Steady progress in mathematics',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'se-010',
        studentId: 'std-004',
        courseOfferingId: 'co-005',
        enrollmentDate: new Date('2025-01-15'),
        status: 'enrolled',
        finalGrade: null,
        attendance: 78.0,
        notes: 'Working on systems design projects',
        createdAt: now,
        updatedAt: now
      },
      // CS 2025 student
      {
        id: 'se-011',
        studentId: 'std-005',
        courseOfferingId: 'co-006',
        enrollmentDate: new Date('2025-01-15'),
        status: 'enrolled',
        finalGrade: null,
        attendance: 100.0,
        notes: 'New student showing great promise',
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('StudentEnrollments', studentEnrollments);

    // Create Manager-Cohort assignments
    const managerCohorts = [
      {
        id: 'mc-001',
        managerId: 'mgr-001',
        cohortId: 'cohort-cs-2024',
        assignedDate: new Date('2024-01-01'),
        role: 'primary',
        isActive: true,
        notes: 'Primary manager for CS 2024 cohort',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mc-002',
        managerId: 'mgr-001',
        cohortId: 'cohort-cs-2025',
        assignedDate: new Date('2025-01-01'),
        role: 'primary',
        isActive: true,
        notes: 'Primary manager for CS 2025 cohort',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mc-003',
        managerId: 'mgr-002',
        cohortId: 'cohort-eng-2024',
        assignedDate: new Date('2024-08-01'),
        role: 'primary',
        isActive: true,
        notes: 'Primary manager for Engineering 2024 cohort',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mc-004',
        managerId: 'mgr-002',
        cohortId: 'cohort-cs-2024',
        assignedDate: new Date('2024-06-01'),
        role: 'secondary',
        isActive: true,
        notes: 'Secondary support for CS 2024 cohort',
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('ManagerCohorts', managerCohorts);

    console.log('✅ Demo data seeded successfully!');
    console.log('\n📋 Test Accounts Created:');
    console.log('👨‍💼 Managers:');
    console.log('  - john.manager@university.edu / Manager123!');
    console.log('  - sarah.director@university.edu / Director123!');
    console.log('\n👩‍🏫 Facilitators:');
    console.log('  - alice.smith@university.edu / Facilitator123!');
    console.log('  - bob.johnson@university.edu / Facilitator123!');
    console.log('  - carol.williams@university.edu / Facilitator123!');
    console.log('  - david.brown@university.edu / Facilitator123!');
    console.log('\n👨‍🎓 Students:');
    console.log('  - emma.student@student.university.edu / Student123!');
    console.log('  - james.learner@student.university.edu / Student123!');
    console.log('  - sophia.scholar@student.university.edu / Student123!');
    console.log('  - michael.pupil@student.university.edu / Student123!');
    console.log('  - olivia.academic@student.university.edu / Student123!');
  },

  async down(queryInterface, Sequelize) {
    // Remove data in reverse order to handle foreign key constraints
    await queryInterface.bulkDelete('ManagerCohorts', null, {});
    await queryInterface.bulkDelete('StudentEnrollments', null, {});
    await queryInterface.bulkDelete('CourseOfferings', null, {});
    await queryInterface.bulkDelete('Modes', null, {});
    await queryInterface.bulkDelete('Modules', null, {});
    await queryInterface.bulkDelete('Students', null, {});
    await queryInterface.bulkDelete('Cohorts', null, {});
    await queryInterface.bulkDelete('Classes', null, {});
    await queryInterface.bulkDelete('Facilitators', null, {});
    await queryInterface.bulkDelete('Managers', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};