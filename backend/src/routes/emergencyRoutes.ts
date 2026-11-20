import { Router } from 'express';
import { emergencyController } from '../controllers/emergencyController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

router.post('/triage', emergencyController.triage);
router.get('/contacts', emergencyController.getContacts);
router.post('/contacts', emergencyController.addContact);
router.delete('/contacts/:id', emergencyController.deleteContact);

export default router;
