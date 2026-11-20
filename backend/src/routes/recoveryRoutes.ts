import { Router } from 'express';
import { recoveryController } from '../controllers/recoveryController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

router.post('/cases', recoveryController.createCase);
router.get('/cases', recoveryController.listCases);
router.get('/cases/:id', recoveryController.getCaseById);
router.patch('/cases/:id', recoveryController.updateCase);

export default router;
