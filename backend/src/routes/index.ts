import { Router } from 'express';
import authRoutes from './authRoutes';
import investigationRoutes from './investigationRoutes';
import analysisRoutes from './analysisRoutes';
import paymentRoutes from './paymentRoutes';
import emergencyRoutes from './emergencyRoutes';
import scamPatternRoutes from './scamPatternRoutes';
import recoveryRoutes from './recoveryRoutes';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    product: 'SmartShield AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    engine: 'Multi-Agent Investigation & Risk Explanation System',
  });
});

router.use('/auth', authRoutes);
router.use('/investigations', investigationRoutes);
router.use('/analyze', analysisRoutes);
router.use('/payment', paymentRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/patterns', scamPatternRoutes);
router.use('/recovery', recoveryRoutes);

export default router;
