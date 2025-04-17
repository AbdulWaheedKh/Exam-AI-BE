const Class = require('../models/class.model');
const logger = require('../logger');

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('subjects');
    logger.info('Retrieved all classes');
    res.json(classes);
  } catch (error) {
    logger.error(`Error retrieving classes: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get class by ID
exports.getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id).populate('subjects');
    if (!classItem) {
      logger.warn(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }
    logger.info(`Retrieved class with ID: ${req.params.id}`);
    res.json(classItem);
  } catch (error) {
    logger.error(`Error retrieving class: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new class
exports.createClass = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const newClass = new Class({
      name,
      description
    });
    
    await newClass.save();
    logger.info(`Created new class: ${name}`);
    res.status(201).json(newClass);
  } catch (error) {
    logger.error(`Error creating class: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a class
exports.updateClass = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    
    if (!updatedClass) {
      logger.warn(`Class not found for update: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    logger.info(`Updated class: ${updatedClass.name}`);
    res.json(updatedClass);
  } catch (error) {
    logger.error(`Error updating class: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a class
exports.deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    
    if (!deletedClass) {
      logger.warn(`Class not found for deletion: ${req.params.id}`);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    logger.info(`Deleted class: ${deletedClass.name}`);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting class: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 