const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin, authorizeTeacher } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       required:
 *         - name
 *         - grade
 *         - subjects
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the class
 *         grade:
 *           type: integer
 *           description: The grade level of the class
 *         subjects:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of subject IDs associated with this class
 *         description:
 *           type: string
 *           description: A detailed description of the class
 *         teacher:
 *           type: string
 *           description: The ID of the teacher assigned to this class
 *         students:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of student IDs enrolled in this class
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the class was created
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Import controllers
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} = require('../controllers/class.controller');

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Class'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getAllClasses);

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get a class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Class not found
 */
router.get('/:id', authenticate, getClassById);

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - grade
 *               - subjects
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the class
 *               grade:
 *                 type: integer
 *                 description: The grade level of the class
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of subject IDs
 *               description:
 *                 type: string
 *                 description: A detailed description of the class
 *               teacher:
 *                 type: string
 *                 description: The ID of the teacher assigned to this class
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 */
router.post('/', authenticate, authorizeTeacher, createClass);

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       404:
 *         description: Class not found
 */
router.put('/:id', authenticate, authorizeTeacher, updateClass);

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Class not found
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteClass);

module.exports = router; 