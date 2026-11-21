
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { config } from '../config';

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

function getHttpStatus(err: unknown): number {
  if (!err || typeof err !== 'object') {
    return 500;
  }

  const error = err as AppError;
  const status = error.status ?? error.statusCode;

  if (
    typeof status === 'number' &&
    Number.isInteger(status) &&
    status >= 400 &&
    status <= 599
  ) {
    return status;
  }

  return 500;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  return 'Internal server error';
}

function getRequestId(req: Request): string {
  const incomingId = req.headers['x-request-id'];

  if (
    typeof incomingId === 'string' &&
    /^[a-zA-Z0-9._-]{1,128}$/.test(incomingId)
  ) {
    return incomingId;
  }

  return randomUUID();
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = getHttpStatus(err);
  const message = getErrorMessage(err);
  const requestId = getRequestId(req);

  const errorStack =
    err instanceof Error ? err.stack : undefined;

  logger.error(
    `[${req.method} ${req.path}] ${status} - ${message}`,
    {
      requestId,
      stack: errorStack,
    }
  );

  const isProduction = config.env === 'production';

  const responseMessage =
    status < 500
      ? message
      : isProduction
        ? 'An unexpected server error occurred. Please try again later.'
        : message;

  res.setHeader('X-Request-ID', requestId);

  res.status(status).json({
    success: false,
    error: responseMessage,
    requestId,
  });
}
