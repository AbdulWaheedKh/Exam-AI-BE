const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const Quiz = require('../models/quiz.model');
const Chapter = require('../models/chapter.model');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for PDF upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Upload PDF and generate quiz
router.post('/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text;

    // Generate quiz questions using OpenAI
    const prompt = `Generate 20 multiple choice questions based on the following text. 
    For each question, provide 4 options and mark the correct answer (0-3). 
    Also provide an explanation for each correct answer.
    Format the response as a JSON array of objects with the following structure:
    {
      "question": "question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "explanation": "explanation text"
    }
    
    Text: ${pdfText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const questions = JSON.parse(completion.choices[0].message.content);

    // Create new quiz
    const quiz = new Quiz({
      title: req.body.title || 'Generated Quiz from PDF',
      chapter: req.body.chapterId,
      grade: req.body.grade,
      subject: req.body.subject,
      questions: questions,
      createdBy: req.user._id
    });

    await quiz.save();

    // Update chapter with the new quiz
    await Chapter.findByIdAndUpdate(
      req.body.chapterId,
      { $push: { quizzes: quiz._id } }
    );

    res.status(201).json({
      message: 'Quiz generated successfully',
      quiz: quiz
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ 
      message: 'Error processing PDF and generating quiz',
      error: error.message 
    });
  }
});

module.exports = router; 