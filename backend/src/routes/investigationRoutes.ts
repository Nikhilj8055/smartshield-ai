
import { Router } from 'express';

import { investigationController } from '../controllers/investigationController';
import { requireAuth } from '../middleware/auth';

import {
  uploadMiddleware,
  validateUploadedImage,
} from '../middleware/upload';

const router = Router();

// All persistent investigation operations require authentication.
router.use(requireAuth);

// Create investigation
router.post('/', investigationController.create);

// List investigations
router.get('/', investigationController.list);

// Get investigation by ID
router.get('/:id', investigationController.getById);

// Add evidence to an investigation
router.post(
  '/:id/evidence',
  uploadMiddleware.single('file'),
  validateUploadedImage,
  investigationController.addEvidence
);

// Delete investigation
router.delete('/:id', investigationController.delete);

export default router;
