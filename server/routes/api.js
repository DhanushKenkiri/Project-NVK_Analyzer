const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();

const OCRController = require('../controllers/ocrController');
const AnalysisController = require('../controllers/analysisController');

router.post('/extract-text', upload.single('file'), OCRController.extractText);
router.post('/analyze-text', AnalysisController.analyzeText);

module.exports = router;