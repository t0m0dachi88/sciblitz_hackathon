import express from 'express';
import {
  getAreaProfiles,
  getAreaProfileHandler,
  getLeaderboard,
  getCategoryLeaderboard,
  generateAIReport,
  getIncidents,
} from '../controllers/areaRiskController.js';

const router = express.Router();

router.get('/profiles', getAreaProfiles);
router.get('/profiles/:thana', getAreaProfileHandler);
router.get('/leaderboard', getLeaderboard);
router.get('/leaderboard/:category', getCategoryLeaderboard);
router.post('/report/:thana', generateAIReport);
router.get('/incidents', getIncidents);

export default router;
