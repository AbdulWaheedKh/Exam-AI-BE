const express = require('express');
const {
  submitQuizResult,
  getQuizResultById,
  getQuizResultsByStudent,
  getQuizResultsByChapter,
  getQuizResultsByQuiz,
  getStudentPerformanceStats
} = require('../controller/quizResult.controller');
const { authenticate, authorizeAdmin, authorizeStudent } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     QuizResult:
 *       type: object
 *       required:
 *         - student
 *         - quiz
 *         - score
 *         - answers
 *       properties:
 *         student:
 *           type: string
 *           description: The ID of the student who took the quiz
 *         quiz:
 *           type: string
 *           description: The ID of the quiz taken
 *         score:
 *           type: number
 *           description: The score achieved in the quiz
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *                 description: The ID of the question
 *               selectedAnswer:
 *                 type: string
 *                 description: The answer selected by the student
 *               isCorrect:
 *                 type: boolean
 *                 description: Whether the answer was correct
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the quiz was submitted
 *     PerformanceStats:
 *       type: object
 *       properties:
 *         totalQuizzes:
 *           type: integer
 *           description: Total number of quizzes taken
 *         averageScore:
 *           type: number
 *           description: Average score across all quizzes
 *         chapterPerformance:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               chapterId:
 *                 type: string
 *                 description: The ID of the chapter
 *               averageScore:
 *                 type: number
 *                 description: Average score for this chapter
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const router = express.Router();

/**
 * @swagger
 * /quiz-results:
 *   post:
 *     summary: Submit a quiz result
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quiz
 *               - answers
 *             properties:
 *               quiz:
 *                 type: string
 *                 description: The ID of the quiz taken
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedAnswer:
 *                       type: string
 *     responses:
 *       201:
 *         description: Quiz result submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuizResult'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access required
 */
router.post('/', authenticate, authorizeStudent, submitQuizResult);

/**
 * @swagger
 * /quiz-results/my-results:
 *   get:
 *     summary: Get authenticated student's quiz results
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student's quiz results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QuizResult'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access required
 */
router.get('/my-results', authenticate, authorizeStudent, getQuizResultsByStudent);

/**
 * @swagger
 * /quiz-results/my-performance:
 *   get:
 *     summary: Get authenticated student's performance statistics
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's performance statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerformanceStats'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access required
 */
router.get('/my-performance', authenticate, authorizeStudent, getStudentPerformanceStats);

/**
 * @swagger
 * /quiz-results/result/{id}:
 *   get:
 *     summary: Get a specific quiz result by ID
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Quiz result ID
 *     responses:
 *       200:
 *         description: Quiz result details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuizResult'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Quiz result not found
 */
router.get('/result/:id', authenticate, authorizeAdmin, getQuizResultById);

/**
 * @swagger
 * /quiz-results/student/{studentId}:
 *   get:
 *     summary: Get all quiz results for a specific student
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Student ID
 *     responses:
 *       200:
 *         description: List of student's quiz results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QuizResult'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Student not found
 */
router.get('/student/:studentId', authenticate, authorizeAdmin, getQuizResultsByStudent);

/**
 * @swagger
 * /quiz-results/chapter/{chapterId}:
 *   get:
 *     summary: Get all quiz results for a specific chapter
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         schema:
 *           type: string
 *         required: true
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: List of quiz results for the chapter
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QuizResult'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Chapter not found
 */
router.get('/chapter/:chapterId', authenticate, authorizeAdmin, getQuizResultsByChapter);

/**
 * @swagger
 * /quiz-results/quiz/{quizId}:
 *   get:
 *     summary: Get all quiz results for a specific quiz
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         schema:
 *           type: string
 *         required: true
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: List of quiz results for the quiz
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QuizResult'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Quiz not found
 */
router.get('/quiz/:quizId', authenticate, authorizeAdmin, getQuizResultsByQuiz);

/**
 * @swagger
 * /quiz-results/student/{studentId}/performance:
 *   get:
 *     summary: Get performance statistics for a specific student
 *     tags: [Quiz Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student's performance statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PerformanceStats'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Student not found
 */
router.get('/student/:studentId/performance', authenticate, authorizeAdmin, getStudentPerformanceStats);

module.exports = router; 