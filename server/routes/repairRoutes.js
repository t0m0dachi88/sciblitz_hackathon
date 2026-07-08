import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getRepairCases,
  getRepairCaseById,
  createRepairCase,
  submitRepairEvidence,
  manuallyApproveRepair,
  getRepairEvidencePublic,
} from '../controllers/repairController.js';

const router = express.Router();

router.get('/public/:repairId', getRepairEvidencePublic);
router.get('/', protect, adminOnly, getRepairCases);
router.get('/:repairId', protect, adminOnly, getRepairCaseById);
router.post('/', protect, adminOnly, createRepairCase);
router.post('/evidence', protect, adminOnly, submitRepairEvidence);
router.post('/:repairId/approve', protect, adminOnly, manuallyApproveRepair);

export default router;
