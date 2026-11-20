import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

router.post('/message', analysisController.analyzeMessage);
router.post('/url', analysisController.analyzeUrl);
router.post('/screenshot', uploadMiddleware.single('file'), analysisController.analyzeScreenshot);

export default router;
