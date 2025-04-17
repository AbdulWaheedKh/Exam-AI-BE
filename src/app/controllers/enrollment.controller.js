const User = require('../models/user.model');
const Class = require('../models/class.model');
const logger = require('../logger');

// Enroll in a class
exports.enrollInClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const userId = req.user.id;

    // Check if class exists
    const classToEnroll = await Class.findById(classId);
    if (!classToEnroll) {
      logger.warn(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user is already enrolled
    const user = await User.findById(userId);
    if (user.enrolledClasses && user.enrolledClasses.includes(classId)) {
      logger.warn(`User ${user.username} already enrolled in class ${classToEnroll.name}`);
      return res.status(400).json({ message: 'Already enrolled in this class' });
    }

    // Add class to user's enrolled classes
    await User.findByIdAndUpdate(
      userId,
      { $push: { enrolledClasses: classId } }
    );

    logger.info(`User ${user.username} enrolled in class ${classToEnroll.name}`);
    res.json({ message: 'Successfully enrolled in class' });
  } catch (error) {
    logger.error(`Error enrolling in class: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unenroll from a class
exports.unenrollFromClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const userId = req.user.id;

    // Check if class exists
    const classToUnenroll = await Class.findById(classId);
    if (!classToUnenroll) {
      logger.warn(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Remove class from user's enrolled classes
    await User.findByIdAndUpdate(
      userId,
      { $pull: { enrolledClasses: classId } }
    );

    logger.info(`User ${req.user.username} unenrolled from class ${classToUnenroll.name}`);
    res.json({ message: 'Successfully unenrolled from class' });
  } catch (error) {
    logger.error(`Error unenrolling from class: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's enrolled classes
exports.getMyClasses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'enrolledClasses',
        populate: {
          path: 'subjects',
          model: 'Subject'
        }
      });

    logger.info(`Retrieved enrolled classes for user: ${user.username}`);
    res.json(user.enrolledClasses);
  } catch (error) {
    logger.error(`Error retrieving enrolled classes: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin enroll user in a class
exports.adminEnrollUser = async (req, res) => {
  try {
    const { userId, classId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if class exists
    const classToEnroll = await Class.findById(classId);
    if (!classToEnroll) {
      logger.warn(`Class not found with ID: ${classId}`);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user is already enrolled
    if (user.enrolledClasses && user.enrolledClasses.includes(classId)) {
      logger.warn(`User ${user.username} already enrolled in class ${classToEnroll.name}`);
      return res.status(400).json({ message: 'User already enrolled in this class' });
    }

    // Add class to user's enrolled classes
    await User.findByIdAndUpdate(
      userId,
      { $push: { enrolledClasses: classId } }
    );

    logger.info(`Admin enrolled user ${user.username} in class ${classToEnroll.name}`);
    res.json({ message: 'Successfully enrolled user in class' });
  } catch (error) {
    logger.error(`Error in admin enrollment: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 