// server/services/ocrService.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class OCRService {
    async extractTextFromImage(imageBuffer) {
        const tempFilePath = path.join(__dirname, 'temp_image.png');
        fs.writeFileSync(tempFilePath, imageBuffer);

        return new Promise((resolve, reject) => {
            exec(`tesseract ${tempFilePath} stdout`, (error, stdout, stderr) => {
                fs.unlinkSync(tempFilePath); // Delete the temporary file
                if (error) {
                    reject(new Error('Failed to extract text: ' + stderr));
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    async extractTextFromPDF(pdfBuffer) {
        // For PDFs, convert to images first (using a library like pdf2image)
        // Then use pytesseract on each image
        throw new Error('PDF support not implemented yet');
    }
}

module.exports = new OCRService();