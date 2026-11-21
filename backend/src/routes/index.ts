
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import authRoutes from './authRoutes';
import investigationRoutes from './investigationRoutes';
import analysisRoutes from './analysisRoutes';
import paymentRoutes from './paymentRoutes';
import emergencyRoutes from './emergencyRoutes';
import scamPatternRoutes from './scamPatternRoutes';
import recoveryRoutes from './recoveryRoutes';

const router = Router();

// ========================================
// HEALTH CHECK
// ========================================

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    product: 'SmartShield AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    engine: 'Multi-Agent Investigation & Risk Explanation System',
  });
});

// ========================================
// AUTHENTICATION RATE LIMITER
// ========================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
});

router.use('/auth', authLimiter, authRoutes);

// ========================================
// MAIN API MODULES
// ========================================

router.use('/investigations', investigationRoutes);
router.use('/analyze', analysisRoutes);
router.use('/payment', paymentRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/patterns', scamPatternRoutes);
router.use('/recovery', recoveryRoutes);

export default router;
