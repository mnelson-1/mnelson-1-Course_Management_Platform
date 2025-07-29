# Course Management Platform

A comprehensive multi-feature backend system for academic institutions to support faculty operations, monitor student progress, and enhance academic coordination. Built with Node.js, Express, Sequelize ORM, and MySQL.

## 🏗️ System Architecture

The platform is built with a modular, role-based architecture supporting:
- **Academic Managers**: Assign facilitators, manage cohorts, oversee operations
- **Facilitators**: Teach courses, track activities, manage student progress
- **Students**: Access courses, view progress, interact with academic content

## 📋 Modules Overview

### ✅ Module 1: Course Allocation System
**Status**: Complete ✅

**Purpose**: Manage facilitator assignments to courses for specific cohorts, trimesters, and intake periods.

**Key Features**:
- Course offering management with comprehensive filtering
- Role-based access control and permissions
- Student enrollment and cohort management
- Academic progress tracking and reporting

### 🚧 Module 2: Facilitator Activity Tracker (FAT)
**Status**: In Development 🚧

**Purpose**: Track weekly activities by facilitators with automated compliance monitoring.

**Key Features**:
- Weekly activity log submissions
- Automated notification system with Redis
- Manager oversight and compliance alerts
- Background job processing for notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- Redis (v6+) - Required for Module 2
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd course-management-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=course_management_dev

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Redis Configuration (Module 2)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Notification Settings (Module 2)
NOTIFICATION_DEADLINE_HOURS=168  # 1 week in hours
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_email_password
```

4. **Database Setup**
```bash
# Run migrations
npm run migrate

# Seed with demo data
npm run seed
```

5. **Start the server**
```bash
npm start
```

The server will be available at `http://localhost:3000`

## 🔐 Authentication & Test Accounts

The system uses JWT-based authentication. Use these test accounts:

### 👨‍💼 Managers
- **john.manager@university.edu** / `Manager123!`
- **sarah.director@university.edu** / `Director123!`

### 👩‍🏫 Facilitators
- **alice.smith@university.edu** / `Facilitator123!`
- **bob.johnson@university.edu** / `Facilitator123!`
- **carol.williams@university.edu** / `Facilitator123!`
- **david.brown@university.edu** / `Facilitator123!`

### 👨‍🎓 Students
- **emma.student@student.university.edu** / `Student123!`
- **james.learner@student.university.edu** / `Student123!`
- **sophia.scholar@student.university.edu** / `Student123!`
- **michael.pupil@student.university.edu** / `Student123!`
- **olivia.academic@student.university.edu** / `Student123!`

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
POST /api/auth/refresh        # Refresh JWT token
```

### Module 1: Course Allocation System

#### Manager Endpoints
```
GET    /api/v1/managers/dashboard                    # Manager dashboard
GET    /api/v1/managers/facilitators                 # List managed facilitators
GET    /api/v1/managers/facilitators/:id             # Facilitator details
GET    /api/v1/managers/cohorts                      # List managed cohorts
GET    /api/v1/managers/cohorts/:id/students         # Students in cohort
PUT    /api/v1/managers/students/:id/cohort          # Update student cohort
POST   /api/v1/managers/cohorts/assign               # Assign manager to cohort
GET    /api/v1/managers/course-offerings             # Manager's course offerings
```

#### Facilitator Endpoints
```
GET    /api/v1/facilitators/profile                  # Facilitator profile
GET    /api/v1/facilitators/manager                  # Manager information
GET    /api/v1/facilitators/course-offerings         # Assigned course offerings
GET    /api/v1/facilitators/course-offerings/:id     # Course offering details
GET    /api/v1/facilitators/course-offerings/:id/students  # Course students
PUT    /api/v1/facilitators/enrollments/:id          # Update student enrollment
GET    /api/v1/facilitators/cohorts                  # Assigned cohorts
```

#### Student Endpoints
```
GET    /api/v1/students/profile                      # Student profile
GET    /api/v1/students/enrolled-courses             # Enrolled courses
GET    /api/v1/students/enrollments/:id              # Enrollment details
GET    /api/v1/students/transcript                   # Academic transcript
GET    /api/v1/students/cohort                       # Cohort information
GET    /api/v1/students/class                        # Class information
GET    /api/v1/students/available-courses            # Available courses
```

#### Course Offering Endpoints
```
POST   /api/v1/course-offerings                      # Create course offering
GET    /api/v1/course-offerings                      # List course offerings
GET    /api/v1/course-offerings/:id                  # Get course offering
PUT    /api/v1/course-offerings/:id                  # Update course offering
DELETE /api/v1/course-offerings/:id                  # Delete course offering
POST   /api/v1/course-offerings/:id/enroll           # Enroll student
GET    /api/v1/course-offerings/stats                # Statistics
```

### Module 2: Facilitator Activity Tracker (FAT)

#### Activity Tracker Endpoints
```
POST   /api/v1/activity-logs                         # Create activity log
GET    /api/v1/activity-logs                         # List activity logs
GET    /api/v1/activity-logs/:id                     # Get activity log
PUT    /api/v1/activity-logs/:id                     # Update activity log
DELETE /api/v1/activity-logs/:id                     # Delete activity log
GET    /api/v1/activity-logs/my-logs                 # Facilitator's logs
GET    /api/v1/activity-logs/compliance              # Compliance report
```

#### Notification Endpoints
```
GET    /api/v1/notifications                         # List notifications
POST   /api/v1/notifications/mark-read/:id           # Mark as read
GET    /api/v1/notifications/unread-count            # Unread count
```

## 🗄️ Database Schema

### Core Models

#### User Management
- **Users**: Base authentication model
- **Managers**: Academic management profiles
- **Facilitators**: Teaching staff profiles
- **Students**: Student profiles

#### Academic Structure
- **Modules**: Course subjects with credits
- **Classes**: Academic year groups
- **Cohorts**: Student groupings by intake
- **Modes**: Delivery modes (online/in-person/hybrid)

#### Course Management
- **CourseOfferings**: Central allocation model
- **StudentEnrollments**: Student-course relationships
- **ManagerCohorts**: Manager-cohort assignments

#### Activity Tracking (Module 2)
- **ActivityTrackers**: Weekly facilitator activity logs
- **Notifications**: System notifications and alerts

### Key Relationships
```
User (1) -> (1) Manager/Facilitator/Student
Manager (1) -> (*) Facilitators
Manager (*) -> (*) Cohorts
Facilitator (1) -> (*) CourseOfferings
CourseOffering (*) -> (*) Students (via StudentEnrollments)
CourseOffering (1) -> (*) ActivityTrackers
```

## 🔧 Development

### Available Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run migrate        # Run database migrations
npm run migrate:undo   # Undo last migration
npm run seed           # Run database seeders
npm run seed:undo      # Undo database seeders
npm test               # Run test suite
npm run lint           # Run ESLint
```

### Project Structure
```
src/
├── app.js                 # Application entry point
├── config/
│   └── config.json        # Database configuration
├── controllers/           # Route controllers
│   ├── authController.js
│   ├── courseOfferingController.js
│   ├── facilitatorController.js
│   ├── managerController.js
│   ├── studentController.js
│   └── activityTrackerController.js  # Module 2
├── middleware/            # Custom middleware
│   ├── auth.js           # JWT authentication
│   └── roleCheck.js      # Role-based access control
├── models/               # Sequelize models
│   ├── index.js
│   ├── User.js
│   ├── Manager.js
│   ├── Facilitator.js
│   ├── Student.js
│   ├── CourseOffering.js
│   └── ActivityTracker.js # Module 2
├── routes/               # API routes
│   ├── authRoutes.js
│   ├── courseOfferingRoutes.js
│   ├── facilitatorRoutes.js
│   ├── managerRoutes.js
│   ├── studentRoutes.js
│   └── activityTrackerRoutes.js  # Module 2
├── services/             # Business logic services
│   ├── notificationService.js    # Module 2
│   └── redisService.js          # Module 2
├── workers/              # Background job workers
│   └── notificationWorker.js    # Module 2
├── migrations/           # Database migrations
└── seeders/             # Database seeders
```

## 🚨 Module 2: Activity Tracking Features

### Activity Log Structure
Each weekly log includes:
- **Week Number**: Academic week identifier
- **Course Allocation**: Associated course offering
- **Attendance**: Array of boolean values for daily attendance
- **Grading Status**: Formative 1, Formative 2, Summative grading
- **Course Moderation**: Moderation completion status
- **Intranet Sync**: System synchronization status
- **Gradebook Status**: Gradebook update status

### Status Values
All tracking fields support three states:
- `Done`: Task completed
- `Pending`: Task in progress
- `Not Started`: Task not yet begun

### Notification System
- **Redis-backed queuing**: Scalable notification processing
- **Automated reminders**: Weekly submission deadline alerts
- **Manager alerts**: Critical deadline and compliance notifications
- **Background workers**: Asynchronous notification delivery

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention via Sequelize ORM
- Rate limiting on API endpoints
- CORS configuration for cross-origin requests
- Helmet.js for security headers

## 📊 Monitoring & Logging

- Comprehensive error logging
- API request/response logging
- Database query logging (development)
- Redis operation monitoring (Module 2)
- Background job status tracking (Module 2)

## 🧪 Testing

The system includes comprehensive test coverage:
- Unit tests for models and services
- Integration tests for API endpoints
- Authentication and authorization tests
- Database transaction tests
- Redis notification system tests (Module 2)

Run tests with:
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # Generate coverage report
```

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Ensure all production secrets are properly configured
2. **Database**: Use connection pooling and read replicas for scale
3. **Redis**: Configure Redis clustering for high availability (Module 2)
4. **Monitoring**: Implement application performance monitoring (APM)
5. **Logging**: Use centralized logging solutions (ELK stack, etc.)
6. **SSL/TLS**: Enable HTTPS in production environments

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale api=3 --scale worker=2
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for academic excellence**