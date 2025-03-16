// server/services/ocrService.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const os = require('os');

class OCRService {
    constructor() {
        // Create a dedicated temp directory for OCR files
        this.tempDir = path.join(os.tmpdir(), 'nvk-ocr-temp');
        
        // Create the directory if it doesn't exist
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    
    async extractTextFromImage(imageBuffer) {
        // Generate a unique filename using timestamp + random number
        const uniqueId = Date.now() + '-' + Math.floor(Math.random() * 10000);
        const tempFilePath = path.join(this.tempDir, `img-${uniqueId}.png`);
        const outputPath = path.join(this.tempDir, `out-${uniqueId}`);
        
        try {
            // Write the buffer to a temporary file
            fs.writeFileSync(tempFilePath, imageBuffer);
            
            // Use tesseract with improved options for better accuracy
            const command = `tesseract ${tempFilePath} ${outputPath} -l eng --oem 1 --psm 6 --dpi 300`;
            const { stderr } = await execPromise(command);
            
            if (stderr && !stderr.includes('Warning')) {
                console.warn('Tesseract warnings:', stderr);
            }
            
            // Read the output file that Tesseract produced
            const outputFile = `${outputPath}.txt`;
            const result = fs.readFileSync(outputFile, 'utf8').trim();
            
            // Clean up temporary files
            this._cleanupFiles([tempFilePath, outputFile]);
            
            // Return empty string if no text was extracted
            if (!result) {
                console.warn('No text extracted from image');
                return '';
            }
            
            return result;
        } catch (error) {
            // Clean up on error
            try {
                this._cleanupFiles([tempFilePath, `${outputPath}.txt`]);
            } catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
            }
            
            console.error('OCR extraction error:', error);
            throw new Error(`Failed to extract text: ${error.message}`);
        }
    }
    
    async extractTextFromPDF(pdfBuffer) {
        // Generate a unique filename
        const uniqueId = Date.now() + '-' + Math.floor(Math.random() * 10000);
        const tempFilePath = path.join(this.tempDir, `pdf-${uniqueId}.pdf`);
        const outputDir = path.join(this.tempDir, `pdf-out-${uniqueId}`);
        
        try {
            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // Write the PDF buffer to a temporary file
            fs.writeFileSync(tempFilePath, pdfBuffer);
            
            // Convert PDF to images using pdftoppm (must be installed)
            await execPromise(`pdftoppm -png ${tempFilePath} ${outputDir}/page`);
            
            // Get all generated images
            const imageFiles = fs.readdirSync(outputDir)
                .filter(file => file.endsWith('.png'))
                .map(file => path.join(outputDir, file))
                .sort(); // Ensure proper page order
            
            // Process each image with OCR
            const textPromises = imageFiles.map(async (imgPath) => {
                const imgBuffer = fs.readFileSync(imgPath);
                return this.extractTextFromImage(imgBuffer);
            });
            
            // Combine all extracted text
            const allText = await Promise.all(textPromises);
            const combinedText = allText.join('\n\n');
            
            // Clean up
            this._cleanupFiles([tempFilePath, ...imageFiles]);
            fs.rmdirSync(outputDir);
            
            return combinedText;
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw new Error(`PDF extraction not available: ${error.message}`);
        }
    }
    
    // Helper to safely clean up files
    _cleanupFiles(filePaths) {
        for (const filePath of filePaths) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }
}

module.exports = new OCRService();