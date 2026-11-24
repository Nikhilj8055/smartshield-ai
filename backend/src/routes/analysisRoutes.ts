
import { Router } from 'express';

import { analysisController } from '../controllers/analysisController';
import { guestInvestigationController } from '../controllers/guestInvestigationController';

import {
  uploadMiddleware,
  validateUploadedImage,
} from '../middleware/upload';

const router = Router();

// ========================================
// PHASE 1: INDIVIDUAL ANALYSIS ENDPOINTS
// ========================================

router.post(
  '/message',
  analysisController.analyzeMessage
);

router.post(
  '/url',
  analysisController.analyzeUrl
);

router.post(
  '/screenshot',
  uploadMiddleware.single('file'),
  validateUploadedImage,
  analysisController.analyzeScreenshot
);

// ========================================
// PHASE 2: UNIFIED GUEST INVESTIGATION
// ========================================

router.post(
  '/investigate',
  uploadMiddleware.single('file'),
  validateUploadedImage,
  guestInvestigationController.analyze
);

export default router;
