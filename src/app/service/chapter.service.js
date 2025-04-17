const Chapter = require('../models/chapter.model');
const logger = require('../logger');

class ChapterService {
  /**
   * Create a new chapter
   * @param {Object} chapterData - Chapter data
   * @returns {Promise<Object>} - Created chapter
   */
  async createChapter(chapterData) {
    try {
      const chapter = new Chapter(chapterData);
      await chapter.save();
      return chapter;
    } catch (error) {
      logger.error(`Error creating chapter: ${error.message}`);
      throw new Error('Failed to create chapter');
    }
  }

  /**
   * Get all chapters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - List of chapters
   */
  async getAllChapters(filters = {}) {
    try {
      const chapters = await Chapter.find(filters).sort({ createdAt: -1 });
      return chapters;
    } catch (error) {
      logger.error(`Error getting chapters: ${error.message}`);
      throw new Error('Failed to get chapters');
    }
  }

  /**
   * Get chapter by ID
   * @param {string} id - Chapter ID
   * @returns {Promise<Object>} - Chapter
   */
  async getChapterById(id) {
    try {
      const chapter = await Chapter.findById(id);
      if (!chapter) {
        throw new Error('Chapter not found');
      }
      return chapter;
    } catch (error) {
      logger.error(`Error getting chapter by ID: ${error.message}`);
      throw new Error('Failed to get chapter');
    }
  }

  /**
   * Update chapter
   * @param {string} id - Chapter ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated chapter
   */
  async updateChapter(id, updateData) {
    try {
      const chapter = await Chapter.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      if (!chapter) {
        throw new Error('Chapter not found');
      }
      return chapter;
    } catch (error) {
      logger.error(`Error updating chapter: ${error.message}`);
      throw new Error('Failed to update chapter');
    }
  }

  /**
   * Delete chapter
   * @param {string} id - Chapter ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteChapter(id) {
    try {
      const chapter = await Chapter.findByIdAndDelete(id);
      if (!chapter) {
        throw new Error('Chapter not found');
      }
      return true;
    } catch (error) {
      logger.error(`Error deleting chapter: ${error.message}`);
      throw new Error('Failed to delete chapter');
    }
  }
}

module.exports = new ChapterService(); 