# Exam-AI: Educational Quiz Application

A comprehensive educational quiz application that allows students to take quizzes based on their enrolled classes, subjects, and chapters. The system supports multiple user roles (students, teachers, and admins) with role-based access control.

## System Overview

Exam-AI is designed to facilitate the creation, management, and taking of educational quizzes. The system follows a hierarchical structure:

1. **Classes** - Top-level organizational units
2. **Subjects** - Topics within classes
3. **Chapters** - Content sections within subjects
4. **Quizzes** - Assessments for chapters
5. **Questions** - Individual test items within quizzes

## User Roles and Workflows

### Admin
- Creates and manages classes
- Assigns teachers to subjects
- Enrolls students in classes
- Has full access to all system features
- Can view performance statistics for all students

### Teacher
- Creates and manages subjects within assigned classes
- Creates chapters and content for their subjects
- Creates quizzes for their chapters
- Views performance statistics for students in their classes

### Student
- Enrolls in available classes
- Accesses subjects and chapters for enrolled classes
- Takes quizzes and receives immediate feedback
- Views their own performance statistics

## System Workflow

1. **Setup Phase**
   - Admin creates classes
   - Admin assigns teachers to classes
   - Teachers create subjects within their assigned classes
   - Teachers create chapters and upload content
   - Teachers create quizzes for their chapters

2. **Enrollment Phase**
   - Students register for accounts
   - Students enroll in available classes
   - Students gain access to subjects and chapters in enrolled classes

3. **Learning Phase**
   - Students access chapter content
   - Students take quizzes to test their knowledge
   - System tracks quiz results and performance

4. **Assessment Phase**
   - Teachers and admins view student performance
   - System generates performance statistics
   - Teachers can adjust content based on performance data

## Features

- **User Authentication**: Secure login and registration for all user types
- **Class Management**: Create, update, and delete classes
- **Subject Organization**: Organize content by subjects within classes
- **Chapter Management**: Create and manage chapters with content
- **Quiz Creation**: Generate quizzes with multiple choice questions
- **Quiz Taking**: Students take quizzes with immediate feedback
- **Performance Tracking**: Track and analyze student performance
- **Role-Based Access**: Different permissions for students, teachers, and admins
- **API Documentation**: Swagger documentation for all endpoints

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd exam-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Documentation

The API is fully documented using Swagger. Once the server is running, you can access the documentation at:

```
http://localhost:5000/api-docs
```

### Authentication Endpoints
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile

### Class Endpoints
- `GET /classes` - Get all classes
- `GET /classes/:id` - Get class by ID
- `POST /classes` - Create new class (admin/teacher only)
- `PUT /classes/:id` - Update class (admin/teacher only)
- `DELETE /classes/:id` - Delete class (admin only)

### Subject Endpoints
- `GET /subjects/class/:classId` - Get all subjects for a specific class
- `GET /subjects/:id` - Get subject by ID
- `POST /subjects/class/:classId` - Create new subject for a class (admin/teacher only)
- `PUT /subjects/:id` - Update subject (admin/teacher only)
- `DELETE /subjects/:id` - Delete subject (admin only)
- `GET /subjects/my-subjects` - Get subjects for authenticated teacher

### Chapter Endpoints
- `GET /chapters/subject/:subjectId` - Get all chapters for a specific subject
- `GET /chapters/:id` - Get chapter by ID
- `POST /chapters/subject/:subjectId` - Create new chapter for a subject (admin/teacher only)
- `PUT /chapters/:id` - Update chapter (admin/teacher only)
- `DELETE /chapters/:id` - Delete chapter (admin only)
- `POST /chapters/:id/upload` - Upload content for a chapter (admin/teacher only)

### Enrollment Endpoints
- `POST /enrollment/enroll/:classId` - Enroll user in a class
- `POST /enrollment/unenroll/:classId` - Unenroll user from a class
- `GET /enrollment/my-classes` - Get user's enrolled classes
- `POST /enrollment/admin/enroll/:userId/:classId` - Admin enrolls a user in a class

### Quiz Endpoints
- `GET /quizzes/chapter/:chapterId` - Get all quizzes for a chapter
- `GET /quizzes/:id` - Get quiz by ID
- `POST /quizzes` - Create new quiz (admin/teacher only)
- `POST /quizzes/:id/submit` - Submit quiz attempt

### Quiz Result Endpoints
- `POST /quiz-results` - Submit a quiz result
- `GET /quiz-results/my-results` - Get authenticated student's quiz results
- `GET /quiz-results/my-performance` - Get authenticated student's performance statistics
- `GET /quiz-results/result/:id` - Get a specific quiz result by ID (admin only)
- `GET /quiz-results/student/:studentId` - Get all quiz results for a specific student (admin only)
- `GET /quiz-results/chapter/:chapterId` - Get all quiz results for a specific chapter (admin only)
- `GET /quiz-results/quiz/:quizId` - Get all quiz results for a specific quiz (admin only)
- `GET /quiz-results/student/:studentId/performance` - Get performance statistics for a specific student (admin only)

## Data Models

### User
- `name` - User's full name
- `email` - User's email address (unique)
- `password` - Hashed password
- `role` - User role (student/teacher/admin)
- `createdAt` - Account creation timestamp

### Class
- `name` - Class name
- `description` - Class description
- `subjects` - Array of subject IDs
- `createdAt` - Creation timestamp

### Subject
- `name` - Subject name
- `description` - Subject description
- `class` - Reference to parent class
- `teacher` - Reference to assigned teacher
- `chapters` - Array of chapter IDs
- `createdAt` - Creation timestamp

### Chapter
- `name` - Chapter name
- `description` - Chapter description
- `subject` - Reference to parent subject
- `order` - Display order within subject
- `content` - Chapter content
- `questions` - Array of question IDs
- `createdAt` - Creation timestamp

### Quiz
- `title` - Quiz title
- `description` - Quiz description
- `chapter` - Reference to parent chapter
- `questions` - Array of question IDs
- `timeLimit` - Time limit in minutes
- `passingScore` - Minimum score to pass
- `createdAt` - Creation timestamp

### Question
- `question` - Question text
- `options` - Array of possible answers
- `correctAnswer` - Index of correct answer
- `explanation` - Explanation of correct answer
- `difficulty` - Question difficulty level
- `quiz` - Reference to parent quiz

### QuizResult
- `student` - Reference to student
- `quiz` - Reference to quiz
- `score` - Achieved score
- `answers` - Array of student's answers
- `submittedAt` - Submission timestamp

### Enrollment
- `student` - Reference to student
- `class` - Reference to class
- `enrolledAt` - Enrollment timestamp
- `status` - Enrollment status (active/inactive)

## Security

- Passwords are hashed using bcrypt
- JWT-based authentication
- Role-based access control
- Protected API endpoints

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 