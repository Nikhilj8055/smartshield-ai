
import { Router } from 'express';
import { scamPatternController } from '../controllers/scamPatternController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public access to scam-pattern browsing
router.get('/clusters', scamPatternController.getClusters);

// Submitting a scam report requires authentication
router.post('/report', requireAuth, scamPatternController.report);

export default router;
