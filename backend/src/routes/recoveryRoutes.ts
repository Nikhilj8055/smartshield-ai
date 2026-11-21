
import { Router } from 'express';
import { recoveryController } from '../controllers/recoveryController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All recovery endpoints require authentication.
router.use(requireAuth);

router.post('/cases', recoveryController.createCase);
router.get('/cases', recoveryController.listCases);
router.get('/cases/:id', recoveryController.getCaseById);
router.patch('/cases/:id', recoveryController.updateCase);

export default router;
