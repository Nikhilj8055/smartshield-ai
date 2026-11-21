
import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';
import {
  uploadMiddleware,
  validateUploadedImage,
} from '../middleware/upload';

const router = Router();

// Message analysis
router.post(
  '/message',
  analysisController.analyzeMessage
);

// URL analysis
router.post(
  '/url',
  analysisController.analyzeUrl
);

// Screenshot analysis
router.post(
  '/screenshot',
  uploadMiddleware.single('file'),
  validateUploadedImage,
  analysisController.analyzeScreenshot
);

export default router;
