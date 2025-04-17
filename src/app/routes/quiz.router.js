const express = require('express');
const {
  generateQuizFromChapter,
  getAllQuizzes,
  getQuizById,
  getQuizzesByChapter,
  deleteQuiz
} = require('../controllers/quiz.controller');
const { authenticate, authorizeAdmin, authorizeStudent } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Quiz:
 *       type: object
 *       required:
 *         - title
 *         - chapter
 *         - questions
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the quiz
 *         chapter:
 *           type: string
 *           description: The ID of the chapter this quiz belongs to
 *         questions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctAnswer:
 *                 type: string
 */

/**
 * @swagger
 * /quizzes:
 *   get:
 *     summary: Get all quizzes
 *     tags: [Quizzes]
 *     responses:
 *       200:
 *         description: List of quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Quiz'
 */
router.get('/', getAllQuizzes);

/**
 * @swagger
 * /quizzes/{id}:
 *   get:
 *     summary: Get a quiz by ID
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 *       404:
 *         description: Quiz not found
 */
router.get('/:id', getQuizById);

/**
 * @swagger
 * /quizzes/chapter/{chapterId}:
 *   get:
 *     summary: Get quizzes by chapter ID
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         schema:
 *           type: string
 *         required: true
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: List of quizzes for the chapter
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Quiz'
 */
router.get('/chapter/:chapterId', getQuizzesByChapter);

/**
 * @swagger
 * /quizzes/generate/{chapterId}:
 *   post:
 *     summary: Generate a quiz from chapter content
 *     tags: [Quizzes]
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
 *       201:
 *         description: Quiz generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/generate/:chapterId', authenticate, authorizeAdmin, generateQuizFromChapter);

/**
 * @swagger
 * /quizzes/{id}:
 *   delete:
 *     summary: Delete a quiz
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Quiz not found
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteQuiz);

module.exports = router; 