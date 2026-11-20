import { Router } from 'express';
import { scamPatternController } from '../controllers/scamPatternController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

router.get('/clusters', scamPatternController.getClusters);
router.post('/report', scamPatternController.report);

export default router;
