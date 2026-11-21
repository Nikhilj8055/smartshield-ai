
import { Router } from 'express';
import { emergencyController } from '../controllers/emergencyController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public emergency triage
router.post('/triage', emergencyController.triage);

// Emergency contacts require authentication
router.get('/contacts', requireAuth, emergencyController.getContacts);
router.post('/contacts', requireAuth, emergencyController.addContact);
router.delete('/contacts/:id', requireAuth, emergencyController.deleteContact);

export default router;
