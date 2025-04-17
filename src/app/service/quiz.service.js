const Quiz = require('../models/quiz.model');
const Chapter = require('../models/chapter.model');
const logger = require('../logger');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class QuizService { 
  /**
   * Generate quiz questions from chapter content
   * @param {string} chapterId - Chapter ID
   * @param {string} userId - User ID who is generating the quiz
   * @returns {Promise<Object>} - Generated quiz
   */
  async generateQuizFromChapter(chapterId, userId) {
    try {
      // Get chapter content
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }

      // Generate questions using OpenAI
      const questions = await this.generateQuestionsWithAI(chapter.content, chapter.title);
      
      // Create quiz
      const quiz = new Quiz({
        title: `Quiz for ${chapter.title}`,
        chapter: chapterId,
        grade: chapter.grade,
        subject: chapter.subject,
        questions,
        createdBy: userId
      });
      
      await quiz.save();
      return quiz;
    } catch (error) {
      logger.error(`Error generating quiz: ${error.message}`);
      throw new Error('Failed to generate quiz');
    }
  }

  /**
   * Generate questions using OpenAI API
   * @param {string} content - Chapter content
   * @param {string} title - Chapter title
   * @returns {Promise<Array>} - Generated questions
   */
  async generateQuestionsWithAI(content, title) {
    try {
      const prompt = `
        Generate 20 multiple choice questions based on the following chapter content.
        Each question should have 4 options (A, B, C, D) and one correct answer.
        Format the response as a JSON array with the following structure:
        [
          {
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0, // Index of correct answer (0-3)
            "explanation": "Brief explanation of the correct answer"
          }
        ]
        
        Chapter Title: ${title}
        Chapter Content: ${content}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      // Parse the response
      const questions = JSON.parse(response.choices[0].message.content);
      return questions;
    } catch (error) {
      logger.error(`Error generating questions with AI: ${error.message}`);
      throw new Error('Failed to generate questions');
    }
  }

  /**
   * Get all quizzes
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - List of quizzes
   */
  async getAllQuizzes(filters = {}) {
    try {
      const quizzes = await Quiz.find(filters)
        .populate('chapter', 'title')
        .sort({ createdAt: -1 });
      return quizzes;
    } catch (error) {
      logger.error(`Error getting quizzes: ${error.message}`);
      throw new Error('Failed to get quizzes');
    }
  }

  /**
   * Get quiz by ID
   * @param {string} id - Quiz ID
   * @returns {Promise<Object>} - Quiz
   */
  async getQuizById(id) {
    try {
      const quiz = await Quiz.findById(id).populate('chapter', 'title');
      if (!quiz) {
        throw new Error('Quiz not found');
      }
      return quiz;
    } catch (error) {
      logger.error(`Error getting quiz by ID: ${error.message}`);
      throw new Error('Failed to get quiz');
    }
  }

  /**
   * Get quizzes by chapter ID
   * @param {string} chapterId - Chapter ID
   * @returns {Promise<Array>} - List of quizzes
   */
  async getQuizzesByChapter(chapterId) {
    try {
      const quizzes = await Quiz.find({ chapter: chapterId })
        .populate('chapter', 'title')
        .sort({ createdAt: -1 });
      return quizzes;
    } catch (error) {
      logger.error(`Error getting quizzes by chapter: ${error.message}`);
      throw new Error('Failed to get quizzes');
    }
  }

  /**
   * Delete quiz
   * @param {string} id - Quiz ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteQuiz(id) {
    try {
      const quiz = await Quiz.findByIdAndDelete(id);
      if (!quiz) {
        throw new Error('Quiz not found');
      }
      return true;
    } catch (error) {
      logger.error(`Error deleting quiz: ${error.message}`);
      throw new Error('Failed to delete quiz');
    }
  }
}

module.exports = new QuizService(); 