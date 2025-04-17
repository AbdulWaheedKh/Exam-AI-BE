const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       required:
 *         - student
 *         - class
 *       properties:
 *         student:
 *           type: string
 *           description: The ID of the student being enrolled
 *         class:
 *           type: string
 *           description: The ID of the class to enroll in
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the enrollment was created
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: The status of the enrollment
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Import controllers
const {
  enrollInClass,
  unenrollFromClass,
  getMyClasses,
  adminEnrollUser
} = require('../controllers/enrollment.controller');

/**
 * @swagger
 * /enrollment/enroll/{classId}:
 *   post:
 *     summary: Enroll the authenticated student in a class
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: Class ID to enroll in
 *     responses:
 *       201:
 *         description: Successfully enrolled in class
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Class not found
 *       409:
 *         description: Already enrolled in this class
 */
router.post('/enroll/:classId', authenticate, enrollInClass);

/**
 * @swagger
 * /enrollment/unenroll/{classId}:
 *   post:
 *     summary: Unenroll the authenticated student from a class
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: Class ID to unenroll from
 *     responses:
 *       200:
 *         description: Successfully unenrolled from class
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Class not found or not enrolled
 */
router.post('/unenroll/:classId', authenticate, unenrollFromClass);

/**
 * @swagger
 * /enrollment/my-classes:
 *   get:
 *     summary: Get all classes the authenticated student is enrolled in
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrolled classes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Enrollment'
 *       401:
 *         description: Unauthorized
 */
router.get('/my-classes', authenticate, getMyClasses);

/**
 * @swagger
 * /enrollment/admin/enroll/{userId}/{classId}:
 *   post:
 *     summary: Admin enrolls a user in a class
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID to enroll
 *       - in: path
 *         name: classId
 *         schema:
 *           type: string
 *         required: true
 *         description: Class ID to enroll in
 *     responses:
 *       201:
 *         description: Successfully enrolled user in class
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User or class not found
 *       409:
 *         description: User already enrolled in this class
 */
router.post('/admin/enroll/:userId/:classId', authenticate, authorizeAdmin, adminEnrollUser);

module.exports = router; 