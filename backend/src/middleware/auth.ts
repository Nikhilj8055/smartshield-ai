
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../repositories';
import { UserProfile } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

/**
 * Extracts and validates a Bearer token from the Authorization header.
 */
function extractBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);

  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== 'bearer' ||
    !parts[1]
  ) {
    return null;
  }

  return parts[1];
}

/**
 * Verifies the JWT and extracts the user ID.
 */
function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    });

    if (
      typeof decoded === 'string' ||
      !decoded ||
      typeof decoded !== 'object'
    ) {
      return null;
    }

    const payload = decoded as JwtPayload;

    if (
      typeof payload.userId !== 'string' ||
      payload.userId.trim().length === 0
    ) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

/**
 * Required authentication middleware.
 * Rejects requests without a valid authenticated user.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required or malformed',
    });
    return;
  }

  const userId = verifyToken(token);

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
    });
    return;
  }

  try {
    const user = await db.findUserById(userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or revoked user session',
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(500).json({
      success: false,
      error: 'Authentication service temporarily unavailable',
    });
  }
}

/**
 * Optional authentication middleware.
 * Allows public requests but attaches a user when a valid token exists.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next();
    return;
  }

  const userId = verifyToken(token);

  if (!userId) {
    next();
    return;
  }

  try {
    const user = await db.findUserById(userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
}
