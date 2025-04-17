const chapterService = require('../service/chapter.service');
const pdfService = require('../service/pdf.service');
const logger = require('../logger');
const Chapter = require('../models/chapter.model');
const fs = require('fs');
const path = require('path');

/**
 * Create a new chapter from PDF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createChapterFromPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    // Extract text from PDF
    const content = await pdfService.processPdfFile(req.file);

    // Create chapter with extracted content
    const chapterData = {
      ...req.body,
      content,
      createdBy: req.user.id
    };

    const chapter = await chapterService.createChapter(chapterData);
    
    res.status(201).json({
      success: true,
      data: chapter
    });
  } catch (error) {
    logger.error(`Error in createChapterFromPdf controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all chapters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllChapters = async (req, res) => {
  try {
    const chapters = await Chapter.find()
      .populate('subject')
      .populate('questions');
    logger.info('Retrieved all chapters');
    res.json(chapters);
  } catch (error) {
    logger.error(`Error retrieving chapters: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get chapter by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('subject')
      .populate('questions');
    
    if (!chapter) {
      logger.warn(`Chapter not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    logger.info(`Retrieved chapter: ${chapter.name}`);
    res.json(chapter);
  } catch (error) {
    logger.error(`Error retrieving chapter: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update chapter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateChapter = async (req, res) => {
  try {
    const { name, description, subject, order, content } = req.body;
    
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      logger.warn(`Chapter not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    chapter.name = name || chapter.name;
    chapter.description = description || chapter.description;
    chapter.subject = subject || chapter.subject;
    chapter.order = order || chapter.order;
    chapter.content = content || chapter.content;
    
    await chapter.save();
    logger.info(`Updated chapter: ${chapter.name}`);
    res.json(chapter);
  } catch (error) {
    logger.error(`Error updating chapter: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete chapter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      logger.warn(`Chapter not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    await chapter.deleteOne();
    logger.info(`Deleted chapter: ${chapter.name}`);
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting chapter: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload chapter content
const uploadContent = async (req, res) => {
  try {
    if (!req.file) {
      logger.warn('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      logger.warn(`Chapter not found with ID: ${req.params.id}`);
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Update chapter with file path
    chapter.content = req.file.path;
    await chapter.save();
    
    logger.info(`Uploaded content for chapter: ${chapter.name}`);
    res.json({ message: 'Content uploaded successfully', chapter });
  } catch (error) {
    logger.error(`Error uploading content: ${error.message}`);
    // Delete uploaded file if it exists
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createChapterFromPdf,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  uploadContent
}; 