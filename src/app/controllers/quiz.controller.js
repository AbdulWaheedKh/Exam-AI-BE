const quizService = require('../service/quiz.service');
const logger = require('../logger');

/**
 * Generate quiz from chapter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateQuizFromChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const quiz = await quizService.generateQuizFromChapter(chapterId, req.user.id);
    
    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    logger.error(`Error in generateQuizFromChapter controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all quizzes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllQuizzes = async (req, res) => {
  try {
    const filters = {};
    
    // Apply filters if provided
    if (req.query.grade) filters.grade = req.query.grade;
    if (req.query.subject) filters.subject = req.query.subject;
    if (req.query.chapter) filters.chapter = req.query.chapter;
    
    const quizzes = await quizService.getAllQuizzes(filters);
    
    res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    logger.error(`Error in getAllQuizzes controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get quiz by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQuizById = async (req, res) => {
  try {
    const quiz = await quizService.getQuizById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    logger.error(`Error in getQuizById controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get quizzes by chapter ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQuizzesByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const quizzes = await quizService.getQuizzesByChapter(chapterId);
    
    res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    logger.error(`Error in getQuizzesByChapter controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteQuiz = async (req, res) => {
  try {
    await quizService.deleteQuiz(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    logger.error(`Error in deleteQuiz controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  generateQuizFromChapter,
  getAllQuizzes,
  getQuizById,
  getQuizzesByChapter,
  deleteQuiz
}; 