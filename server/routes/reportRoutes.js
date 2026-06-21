import express from 'express';
import { analyzeReport, saveReport, getReports, getReportById, updateReport, getStats, getMyReports } from '../controllers/reportController.js';
import { upload } from '../middleware/upload.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Route to handle image upload and AI analysis (public)
router.post('/analyze', upload.single('image'), analyzeReport);

// Route to confirm and save the report to DB (public, but links to user if authenticated)
router.post('/confirm', (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return protect(req, res, next);
  next();
}, saveReport);

// Route to get current user's reports (protected)
router.get('/mine', protect, getMyReports);

// Route to get aggregated stats.
// Public: counts only visible reports. Admin: ?all=true requires auth.
router.get('/stats', (req, res, next) => {
  if (req.query.all === 'true') return protect(req, res, next);
  next();
}, getStats);

// Route to get all reports.
// Public: only verified/resolved. Admin: ?all=true requires auth.
router.get('/', (req, res, next) => {
  if (req.query.all === 'true') return protect(req, res, next);
  next();
}, getReports);

// Route to get a single report by ID
router.get('/:id', getReportById);

// Route to update a report (status, severity, admin notes) — admin only
router.put('/:id', protect, adminOnly, updateReport);

export default router;
