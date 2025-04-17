const quizResultService = require('../service/quizResult.service');
const logger = require('../logger');

/**
 * Submit quiz result
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitQuizResult = async (req, res) => {
  try {
    const resultData = {
      ...req.body,
      student: req.user.id
    };
    
    const result = await quizResultService.submitQuizResult(resultData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error in submitQuizResult controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get quiz result by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQuizResultById = async (req, res) => {
  try {
    const result = await quizResultService.getQuizResultById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error in getQuizResultById controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get quiz results by student ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQuizResultsByStudent = async (req, res) => {
  try {
    // If student ID is provided in params, use it, otherwise use the current user's ID
    const studentId = req.params.studentId || req.user.id;
    const results = await quizResultService.getQuizResultsByStudent(studentId);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error in getQuizResultsByStudent controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get quiz results by chapter ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQuizResultsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const results = await quizResultService.getQuizResultsByChapter(chapterId);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error in getQuizResultsByChapter controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get quiz results by quiz ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQuizResultsByQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const results = await quizResultService.getQuizResultsByQuiz(quizId);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error in getQuizResultsByQuiz controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get student performance statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentPerformanceStats = async (req, res) => {
  try {
    // If student ID is provided in params, use it, otherwise use the current user's ID
    const studentId = req.params.studentId || req.user.id;
    const stats = await quizResultService.getStudentPerformanceStats(studentId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Error in getStudentPerformanceStats controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  submitQuizResult,
  getQuizResultById,
  getQuizResultsByStudent,
  getQuizResultsByChapter,
  getQuizResultsByQuiz,
  getStudentPerformanceStats
}; 