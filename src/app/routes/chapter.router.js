const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate, authorizeAdmin, authorizeTeacher } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Chapter:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - subject
 *         - order
 *         - content
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the chapter
 *         description:
 *           type: string
 *           description: A detailed description of the chapter
 *         subject:
 *           type: string
 *           description: The ID of the subject this chapter belongs to
 *         order:
 *           type: integer
 *           description: The order of the chapter in the subject
 *         content:
 *           type: string
 *           description: The main content of the chapter
 *         questions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of question IDs associated with this chapter
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the chapter was created
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/chapters')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Import controllers
const {
  getAllChapters,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  uploadContent,
  createChapterFromPdf
} = require('../controllers/chapter.controller');

/**
 * @swagger
 * /chapters:
 *   get:
 *     summary: Get all chapters
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chapters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chapter'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getAllChapters);

/**
 * @swagger
 * /chapters/{id}:
 *   get:
 *     summary: Get a chapter by ID
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chapter'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chapter not found
 */
router.get('/:id', authenticate, getChapterById);

/**
 * @swagger
 * /chapters:
 *   post:
 *     summary: Create a new chapter from PDF
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - pdf
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to create chapter from
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chapter'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 */
router.post('/', authenticate, authorizeTeacher, createChapterFromPdf);

/**
 * @swagger
 * /chapters/{id}:
 *   put:
 *     summary: Update a chapter
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Chapter'
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chapter'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       404:
 *         description: Chapter not found
 */
router.put('/:id', authenticate, authorizeTeacher, updateChapter);

/**
 * @swagger
 * /chapters/{id}:
 *   delete:
 *     summary: Delete a chapter
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Chapter not found
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteChapter);

/**
 * @swagger
 * /chapters/{id}/content:
 *   post:
 *     summary: Upload chapter content
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 format: binary
 *                 description: Content file to upload
 *     responses:
 *       200:
 *         description: Content uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chapter'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher access required
 *       404:
 *         description: Chapter not found
 */
router.post('/:id/content', authenticate, authorizeTeacher, upload.single('content'), uploadContent);

module.exports = router; 