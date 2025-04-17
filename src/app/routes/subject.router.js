const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin, authorizeTeacher } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Subject:
 *       type: object
 *       required:
 *         - name
 *         - class
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the subject
 *         class:
 *           type: string
 *           description: The ID of the class this subject belongs to
 *         description:
 *           type: string
 *           description: A detailed description of the subject
 *         teacher:
 *           type: string
 *           description: The ID of the teacher assigned to this subject
 *         chapters:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of chapter IDs associated with this subject
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the subject was created
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Import controllers
const {
  getSubjectsByClass,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getMySubjects
} = require('../controllers/subject.controller');

/**
 * @swagger
 * /subjects/class/{classId}:
 *   get:
 *     summary: Get all subjects for a specific class
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of subjects for the class
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Class not found
 */
router.get('/class/:classId', authenticate, getSubjectsByClass);

/**
 * @swagger
 * /subjects/{id}:
 *   get:
 *     summary: Get a subject by ID
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subject not found
 */
router.get('/:id', authenticate, getSubjectById);

/**
 * @swagger
 * /subjects/my-subjects:
 *   get:
 *     summary: Get subjects assigned to the authenticated teacher
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subjects assigned to the teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
 */
router.get('/my-subjects', authenticate, getMySubjects);

/**
 * @swagger
 * /subjects/class/{classId}:
 *   post:
 *     summary: Create a new subject for a class
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the subject
 *               description:
 *                 type: string
 *                 description: A detailed description of the subject
 *               teacher:
 *                 type: string
 *                 description: The ID of the teacher assigned to this subject
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       404:
 *         description: Class not found
 */
router.post('/class/:classId', authenticate, authorizeTeacher, createSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Update a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Subject'
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       404:
 *         description: Subject not found
 */
router.put('/:id', authenticate, authorizeTeacher, updateSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Subject not found
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteSubject);

module.exports = router; 