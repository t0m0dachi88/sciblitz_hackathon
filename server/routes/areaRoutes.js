import express from 'express';
import {
  getAreaProfiles,
  getAreaProfileHandler,
  getLeaderboard,
  getCategoryLeaderboard,
  generateAIReport,
  getIncidents,
  getTimeline,
} from '../controllers/areaRiskController.js';

const router = express.Router();

router.get('/profiles', getAreaProfiles);
router.get('/profiles/:thana', getAreaProfileHandler);
router.get('/leaderboard', getLeaderboard);
router.get('/leaderboard/:category', getCategoryLeaderboard);
router.post('/report/:thana', generateAIReport);
router.get('/incidents', getIncidents);
router.get('/timeline/:thana', getTimeline);

export default router;
