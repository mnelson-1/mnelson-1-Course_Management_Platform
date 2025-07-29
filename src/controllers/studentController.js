const { 
  Student, 
  User, 
  Cohort, 
  Class, 
  CourseOffering, 
  Module, 
  Facilitator, 
  Manager, 
  Mode,
  StudentEnrollment 
} = require('../models');
const { Op } = require('sequelize');

// Get student's profile and dashboard data
exports.getMyProfile = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const student = await Student.findByPk(studentId, {
      include: [
        { model: User, as: 'user' },
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' },
        {
          model: CourseOffering,
          as: 'enrolledCourses',
          through: { 
            model: StudentEnrollment, 
            as: 'enrollment',
            attributes: ['id', 'enrollmentDate', 'status', 'finalGrade', 'attendance', 'notes']
          },
          include: [
            { model: Module, as: 'module' },
            { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
            { model: Mode, as: 'mode' },
            { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] }
          ]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Calculate statistics
    const totalCourses = student.enrolledCourses.length;
    const activeCourses = student.enrolledCourses.filter(course => 
      course.enrollment.status === 'enrolled' && course.status === 'active'
    ).length;
    const completedCourses = student.enrolledCourses.filter(course => 
      course.enrollment.status === 'completed'
    ).length;
    
    const grades = student.enrolledCourses
      .map(course => course.enrollment.finalGrade)
      .filter(grade => grade !== null);
    
    const averageGrade = grades.length > 0 
      ? (grades.reduce((sum, grade) => sum + parseFloat(grade), 0) / grades.length).toFixed(2)
      : null;

    res.json({
      student,
      statistics: {
        totalCourses,
        activeCourses,
        completedCourses,
        averageGrade: averageGrade ? parseFloat(averageGrade) : null,
        totalCredits: student.enrolledCourses.reduce((sum, course) => sum + (course.module.credits || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get student's enrolled courses
exports.getMyEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { 
      trimester, 
      year, 
      status, 
      enrollmentStatus,
      page = 1, 
      limit = 10 
    } = req.query;

    const courseFilters = {};
    if (trimester) courseFilters.trimester = trimester;
    if (year) courseFilters.year = year;
    if (status) courseFilters.status = status;

    const enrollmentFilters = { studentId };
    if (enrollmentStatus) enrollmentFilters.status = enrollmentStatus;

    const offset = (page - 1) * limit;

    const { count, rows: enrollments } = await StudentEnrollment.findAndCountAll({
      where: enrollmentFilters,
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          where: courseFilters,
          include: [
            { model: Module, as: 'module' },
            { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
            { model: Cohort, as: 'cohort' },
            { model: Class, as: 'class' },
            { model: Mode, as: 'mode' },
            { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['enrollmentDate', 'DESC']]
    });

    res.json({
      enrollments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get specific course enrollment details
exports.getCourseEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = req.user.studentId;

    const enrollment = await StudentEnrollment.findOne({
      where: { id: enrollmentId, studentId },
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            { model: Module, as: 'module' },
            { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
            { model: Cohort, as: 'cohort' },
            { model: Class, as: 'class' },
            { model: Mode, as: 'mode' },
            { model: Manager, as: 'manager', include: [{ model: User, as: 'user' }] },
            {
              model: Student,
              as: 'enrolledStudents',
              through: { 
                model: StudentEnrollment,
                attributes: ['status']
              },
              include: [{ model: User, as: 'user' }]
            }
          ]
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Course enrollment not found' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Error fetching course enrollment details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get student's cohort information and classmates
exports.getMyCohort = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: Cohort,
          as: 'cohort',
          include: [
            {
              model: Student,
              as: 'students',
              include: [
                { model: User, as: 'user' },
                { model: Class, as: 'class' }
              ]
            },
            {
              model: Manager,
              as: 'managers',
              through: { 
                model: ManagerCohort,
                attributes: ['role', 'assignedDate']
              },
              include: [{ model: User, as: 'user' }]
            },
            {
              model: CourseOffering,
              as: 'courseOfferings',
              include: [
                { model: Module, as: 'module' },
                { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
                { model: Mode, as: 'mode' }
              ]
            }
          ]
        }
      ]
    });

    if (!student || !student.cohort) {
      return res.status(404).json({ error: 'Cohort information not found' });
    }

    // Remove current student from classmates list
    const classmates = student.cohort.students.filter(s => s.id !== studentId);

    res.json({
      cohort: {
        ...student.cohort.toJSON(),
        students: classmates
      },
      totalClassmates: classmates.length
    });
  } catch (error) {
    console.error('Error fetching cohort information:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get student's class information
exports.getMyClass = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: Class,
          as: 'class',
          include: [
            {
              model: Student,
              as: 'students',
              include: [
                { model: User, as: 'user' },
                { model: Cohort, as: 'cohort' }
              ]
            },
            {
              model: CourseOffering,
              as: 'courseOfferings',
              include: [
                { model: Module, as: 'module' },
                { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] }
              ]
            }
          ]
        }
      ]
    });

    if (!student || !student.class) {
      return res.status(404).json({ error: 'Class information not found' });
    }

    // Remove current student from classmates list
    const classmates = student.class.students.filter(s => s.id !== studentId);

    res.json({
      class: {
        ...student.class.toJSON(),
        students: classmates
      },
      totalClassmates: classmates.length
    });
  } catch (error) {
    console.error('Error fetching class information:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get student's academic progress/transcript
exports.getMyTranscript = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const enrollments = await StudentEnrollment.findAll({
      where: { studentId },
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            { model: Module, as: 'module' },
            { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] }
          ]
        }
      ],
      order: [['courseOffering', 'year', 'ASC'], ['courseOffering', 'trimester', 'ASC']]
    });

    // Group by academic year and trimester
    const transcript = enrollments.reduce((acc, enrollment) => {
      const year = enrollment.courseOffering.year;
      const trimester = enrollment.courseOffering.trimester;
      const key = `${year}-T${trimester}`;

      if (!acc[key]) {
        acc[key] = {
          year,
          trimester,
          courses: [],
          totalCredits: 0,
          completedCredits: 0,
          gpa: null
        };
      }

      const courseData = {
        module: enrollment.courseOffering.module,
        facilitator: enrollment.courseOffering.facilitator,
        enrollment: {
          status: enrollment.status,
          finalGrade: enrollment.finalGrade,
          attendance: enrollment.attendance,
          enrollmentDate: enrollment.enrollmentDate
        }
      };

      acc[key].courses.push(courseData);
      acc[key].totalCredits += enrollment.courseOffering.module.credits || 0;

      if (enrollment.status === 'completed' && enrollment.finalGrade !== null) {
        acc[key].completedCredits += enrollment.courseOffering.module.credits || 0;
      }

      return acc;
    }, {});

    // Calculate GPA for each period
    Object.keys(transcript).forEach(key => {
      const period = transcript[key];
      const grades = period.courses
        .filter(course => course.enrollment.finalGrade !== null)
        .map(course => parseFloat(course.enrollment.finalGrade));

      if (grades.length > 0) {
        period.gpa = (grades.reduce((sum, grade) => sum + grade, 0) / grades.length).toFixed(2);
      }
    });

    // Calculate overall statistics
    const allGrades = enrollments
      .filter(e => e.finalGrade !== null)
      .map(e => parseFloat(e.finalGrade));

    const overallGPA = allGrades.length > 0 
      ? (allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length).toFixed(2)
      : null;

    const totalCreditsEarned = enrollments
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.courseOffering.module.credits || 0), 0);

    const totalCreditsAttempted = enrollments
      .reduce((sum, e) => sum + (e.courseOffering.module.credits || 0), 0);

    res.json({
      transcript: Object.values(transcript),
      summary: {
        overallGPA: overallGPA ? parseFloat(overallGPA) : null,
        totalCreditsEarned,
        totalCreditsAttempted,
        completionRate: totalCreditsAttempted > 0 
          ? ((totalCreditsEarned / totalCreditsAttempted) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching student transcript:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get available courses for enrollment (if needed)
exports.getAvailableCourses = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { trimester, year, page = 1, limit = 10 } = req.query;

    // Get student's cohort and class
    const student = await Student.findByPk(studentId, {
      include: [
        { model: Cohort, as: 'cohort' },
        { model: Class, as: 'class' }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get courses already enrolled in
    const enrolledCourseIds = await StudentEnrollment.findAll({
      where: { studentId },
      attributes: ['courseOfferingId']
    }).then(enrollments => enrollments.map(e => e.courseOfferingId));

    const filters = {
      cohortId: student.cohortId,
      classId: student.classId,
      status: 'active',
      id: { [Op.notIn]: enrolledCourseIds }
    };

    if (trimester) filters.trimester = trimester;
    if (year) filters.year = year;

    const offset = (page - 1) * limit;

    const { count, rows: availableCourses } = await CourseOffering.findAndCountAll({
      where: filters,
      include: [
        { model: Module, as: 'module' },
        { model: Facilitator, as: 'facilitator', include: [{ model: User, as: 'user' }] },
        { model: Mode, as: 'mode' }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['startDate', 'ASC']]
    });

    res.json({
      availableCourses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching available courses:', error);
    res.status(500).json({ error: error.message });
  }
};