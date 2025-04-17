const QuizResult = require('../models/quizResult.model');
const Quiz = require('../models/quiz.model');
const logger = require('../logger');

class QuizResultService {
  /**
   * Submit quiz result
   * @param {Object} resultData - Quiz result data
   * @returns {Promise<Object>} - Created quiz result
   */
  async submitQuizResult(resultData) {
    try {
      // Get the quiz to check answers
      const quiz = await Quiz.findById(resultData.quiz);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Calculate score and percentage
      const answers = resultData.answers.map(answer => {
        const question = quiz.questions.find(q => q._id.toString() === answer.questionId.toString());
        const isCorrect = question && answer.selectedAnswer === question.correctAnswer;
        return {
          ...answer,
          isCorrect
        };
      });

      const score = answers.filter(answer => answer.isCorrect).length;
      const percentage = (score / 20) * 100;

      // Create quiz result
      const quizResult = new QuizResult({
        ...resultData,
        answers,
        score,
        percentage
      });

      await quizResult.save();
      return quizResult;
    } catch (error) {
      logger.error(`Error submitting quiz result: ${error.message}`);
      throw new Error('Failed to submit quiz result');
    }
  }

  /**
   * Get quiz result by ID
   * @param {string} id - Quiz result ID
   * @returns {Promise<Object>} - Quiz result
   */
  async getQuizResultById(id) {
    try {
      const quizResult = await QuizResult.findById(id)
        .populate('quiz', 'title')
        .populate('chapter', 'title')
        .populate('student', 'name');
      
      if (!quizResult) {
        throw new Error('Quiz result not found');
      }
      return quizResult;
    } catch (error) {
      logger.error(`Error getting quiz result by ID: ${error.message}`);
      throw new Error('Failed to get quiz result');
    }
  }

  /**
   * Get quiz results by student ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} - List of quiz results
   */
  async getQuizResultsByStudent(studentId) {
    try {
      const quizResults = await QuizResult.find({ student: studentId })
        .populate('quiz', 'title')
        .populate('chapter', 'title')
        .sort({ completedAt: -1 });
      return quizResults;
    } catch (error) {
      logger.error(`Error getting quiz results by student: ${error.message}`);
      throw new Error('Failed to get quiz results');
    }
  }

  /**
   * Get quiz results by chapter ID
   * @param {string} chapterId - Chapter ID
   * @returns {Promise<Array>} - List of quiz results
   */
  async getQuizResultsByChapter(chapterId) {
    try {
      const quizResults = await QuizResult.find({ chapter: chapterId })
        .populate('quiz', 'title')
        .populate('student', 'name')
        .sort({ completedAt: -1 });
      return quizResults;
    } catch (error) {
      logger.error(`Error getting quiz results by chapter: ${error.message}`);
      throw new Error('Failed to get quiz results');
    }
  }

  /**
   * Get quiz results by quiz ID
   * @param {string} quizId - Quiz ID
   * @returns {Promise<Array>} - List of quiz results
   */
  async getQuizResultsByQuiz(quizId) {
    try {
      const quizResults = await QuizResult.find({ quiz: quizId })
        .populate('student', 'name')
        .sort({ completedAt: -1 });
      return quizResults;
    } catch (error) {
      logger.error(`Error getting quiz results by quiz: ${error.message}`);
      throw new Error('Failed to get quiz results');
    }
  }

  /**
   * Get student performance statistics
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} - Performance statistics
   */
  async getStudentPerformanceStats(studentId) {
    try {
      const quizResults = await QuizResult.find({ student: studentId });
      
      const totalQuizzes = quizResults.length;
      const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
      const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;
      const averagePercentage = totalQuizzes > 0 ? quizResults.reduce((sum, result) => sum + result.percentage, 0) / totalQuizzes : 0;
      
      return {
        totalQuizzes,
        totalScore,
        averageScore,
        averagePercentage
      };
    } catch (error) {
      logger.error(`Error getting student performance stats: ${error.message}`);
      throw new Error('Failed to get student performance stats');
    }
  }
}

module.exports = new QuizResultService(); 