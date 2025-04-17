const Subject = require('../models/subject.model');
const Class = require('../models/class.model');
const logger = require('../logger');

// Get subjects by class
exports.getSubjectsByClass = async (req, res) => {
  try {
    const subjects = await Subject.find({ class: req.params.classId })
      .populate('teacher', 'username email')
      .populate('chapters');
    logger.info(`Retrieved subjects for class: ${req.params.classId}`);
    res.json(subjects);
  } catch (error) {
    logger.error(`Error retrieving subjects: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get subject by ID
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('teacher', 'username email')
      .populate('chapters')
      .populate('class');
    
    if (!subject) {
      logger.warn(`Subject not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    logger.info(`Retrieved subject: ${subject.name}`);
    res.json(subject);
  } catch (error) {
    logger.error(`Error retrieving subject: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get subjects for logged-in teacher
exports.getMySubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ teacher: req.user.id })
      .populate('class')
      .populate('chapters');
    logger.info(`Retrieved subjects for teacher: ${req.user.username}`);
    res.json(subjects);
  } catch (error) {
    logger.error(`Error retrieving teacher subjects: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new subject
exports.createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const classId = req.params.classId;

    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      logger.warn(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    const subject = new Subject({
      name,
      description,
      class: classId,
      teacher: req.user.id
    });

    await subject.save();

    // Add subject to class
    await Class.findByIdAndUpdate(
      classId,
      { $push: { subjects: subject._id } }
    );

    logger.info(`Created new subject: ${name} for class: ${classId}`);
    res.status(201).json(subject);
  } catch (error) {
    logger.error(`Error creating subject: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a subject
exports.updateSubject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      logger.warn(`Subject not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if user is the teacher of this subject
    if (subject.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized update attempt on subject: ${req.params.id} by user: ${req.user.username}`);
      return res.status(403).json({ message: 'Not authorized to update this subject' });
    }

    subject.name = name || subject.name;
    subject.description = description || subject.description;

    await subject.save();
    logger.info(`Updated subject: ${subject.name}`);
    res.json(subject);
  } catch (error) {
    logger.error(`Error updating subject: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      logger.warn(`Subject not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Remove subject from class
    await Class.findByIdAndUpdate(
      subject.class,
      { $pull: { subjects: subject._id } }
    );

    await subject.deleteOne();
    logger.info(`Deleted subject: ${subject.name}`);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting subject: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 