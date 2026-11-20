import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`[${req.method} ${req.url}] ${status} - ${message}`, {
    stack: err.stack,
  });

  res.status(status).json({
    success: false,
    error: status === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : message,
    requestId: req.headers['x-request-id'] || undefined,
  });
}
