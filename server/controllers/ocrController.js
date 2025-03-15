const OCRService = require('../services/ocrService');
const ResponseFormatter = require('../utils/responseFormatter');

class OCRController {
    async extractText(req, res) {
        try {
            const file = req.file;
            if (!file) {
                console.error('No file uploaded.');
                return res.status(400).json(ResponseFormatter.formatError('No file uploaded.'));
            }

            console.log('File uploaded:', file.originalname);

            let extractedText;
            if (file.mimetype.startsWith('image/')) {
                console.log('Extracting text from image...');
                extractedText = await OCRService.extractTextFromImage(file.buffer);
            } else {
                console.error('Unsupported file type:', file.mimetype);
                return res.status(400).json(ResponseFormatter.formatError('Unsupported file type.'));
            }

            console.log('Text extracted successfully.');
            res.json(ResponseFormatter.formatSuccess(extractedText, 'Text extracted successfully'));
        } catch (error) {
            console.error('Error extracting text:', error);
            res.status(500).json(ResponseFormatter.formatError('Failed to extract text', error));
        }
    }
}

module.exports = new OCRController();