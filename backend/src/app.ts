
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

export const app = express();

// ========================================
// SECURITY HEADERS
// ========================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = config.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      // Allow explicitly configured frontend origins.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow localhost during development.
      if (
        config.env === 'development' &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      const error = new Error('Origin not allowed by CORS') as Error & {
        status: number;
      };

      error.status = 403;
      return callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// ========================================
// RATE LIMITING
// ========================================

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
});

app.use('/api/', generalLimiter);

// ========================================
// BODY PARSING
// ========================================

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// ========================================
// API ROUTES
// ========================================

app.use('/api/v1', routes);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use(errorHandler);
