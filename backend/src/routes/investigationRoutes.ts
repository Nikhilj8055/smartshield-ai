import { Router } from 'express';
import { investigationController } from '../controllers/investigationController';
import { optionalAuth } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

router.use(optionalAuth);

router.post('/', investigationController.create);
router.get('/', investigationController.list);
router.get('/:id', investigationController.getById);
router.post('/:id/evidence', uploadMiddleware.single('file'), investigationController.addEvidence);
router.delete('/:id', investigationController.delete);

export default router;
