const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const PdfRawData = require('../models/pdfRawData.model');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for PDF upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     PdfRawData:
 *       type: object
 *       required:
 *         - title
 *         - originalFileName
 *         - extractedText
 *         - uploadedBy
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the PDF data
 *         title:
 *           type: string
 *           description: The title of the PDF document
 *         originalFileName:
 *           type: string
 *           description: The original filename of the uploaded PDF
 *         extractedText:
 *           type: string
 *           description: The extracted text content from the PDF
 *         uploadedBy:
 *           type: string
 *           description: The ID of the user who uploaded the PDF
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the PDF was uploaded
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the PDF data was last updated
 */

/**
 * @swagger
 * /api/pdf-raw/upload:
 *   post:
 *     summary: Upload a PDF file and store its extracted text
 *     tags: [PDF Raw Data]
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
 *                 description: The PDF file to upload
 *               title:
 *                 type: string
 *                 description: Optional title for the PDF document
 *     responses:
 *       201:
 *         description: PDF uploaded and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     originalFileName:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: No PDF file uploaded
 *       500:
 *         description: Error processing PDF
 */
// router.post('/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text;

    // Create new PDF raw data entry
    const pdfRawData = new PdfRawData({
      title: req.body.title || req.file.originalname,
      originalFileName: req.file.originalname,
      extractedText: pdfText,
      userId: req.body.userId,
    });

    await pdfRawData.save();

    res.status(201).json({
      message: 'PDF uploaded and processed successfully',
      data: {
        id: pdfRawData._id,
        title: pdfRawData.title,
        originalFileName: pdfRawData.originalFileName,
        createdAt: pdfRawData.createdAt
      }
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ 
      message: 'Error processing PDF',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/pdf-raw:
 *   get:
 *     summary: Get all PDF data entries for the authenticated user
 *     tags: [PDF Raw Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of PDF data entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   originalFileName:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error fetching PDF data
 */
// router.get('/', authenticateToken, async (req, res) => {
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pdfData = await PdfRawData.find({userId : id})
      .select('title originalFileName createdAt')
      .sort({ createdAt: -1 });

    res.json(pdfData);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching PDF data',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/pdf-raw/{id}:
 *   get:
 *     summary: Get a specific PDF data entry by ID
 *     tags: [PDF Raw Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The PDF data ID
 *     responses:
 *       200:
 *         description: PDF data entry details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PdfRawData'
 *       404:
 *         description: PDF data not found
 *       500:
 *         description: Error fetching PDF data
 */
router.get('/:id', async (req, res) => {
  try {
    const pdfData = await PdfRawData.findOne({
      _id: req.params.id,
      // uploadedBy: req.user._id
    });

    if (!pdfData) {
      return res.status(404).json({ message: 'PDF data not found' });
    }

    res.json(pdfData);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching PDF data',
      error: error.message 
    });
  }
});

module.exports = router; 