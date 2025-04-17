const pdf = require('pdf-parse');
const fs = require('fs');
const logger = require('../logger');

class PdfService {
  /**
   * Extract text from a PDF file
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<string>} - Extracted text from the PDF
   */
  async extractTextFromPdf(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      logger.error(`Error extracting text from PDF: ${error.message}`);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Process PDF file and return extracted text
   * @param {Object} file - Uploaded file object
   * @returns {Promise<string>} - Extracted text from the PDF
   */
  async processPdfFile(file) {
    try {
      // Save the uploaded file temporarily
      const tempFilePath = `/tmp/${Date.now()}-${file.originalname}`;
      fs.writeFileSync(tempFilePath, file.buffer);
      
      // Extract text from the PDF
      const extractedText = await this.extractTextFromPdf(tempFilePath);
      
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      
      return extractedText;
    } catch (error) {
      logger.error(`Error processing PDF file: ${error.message}`);
      throw new Error('Failed to process PDF file');
    }
  }
}

module.exports = new PdfService(); 