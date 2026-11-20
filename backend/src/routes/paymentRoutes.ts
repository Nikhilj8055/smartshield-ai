import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';

const router = Router();

router.post('/investigate', paymentController.investigate);

export default router;
