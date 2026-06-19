import express from 'express';
import { analyzeReport, saveReport } from '../controllers/reportController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Route to handle image upload and AI analysis
router.post('/analyze', upload.single('image'), analyzeReport);

// Route to confirm and save the report to DB
router.post('/confirm', saveReport);

export default router;
