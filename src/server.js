const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Exam AI API Documentation"
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.use('/api/auth', require('./app/routes/auth'));
app.use('/api/classes', require('./app/routes/class.router'));
app.use('/api/subjects', require('./app/routes/subject.router'));
app.use('/api/chapters', require('./app/routes/chapter.router'));
app.use('/api/enrollment', require('./app/routes/enrollment.router'));
app.use('/api/quizzes', require('./app/routes/quiz.router'));
app.use('/api/pdf-quiz', require('./app/routes/pdfQuiz.router'));
app.use('/api/pdf-raw', require('./app/routes/pdfRawData.router'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 