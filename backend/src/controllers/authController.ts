import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../repositories';
import { config } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  phone_number: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      }

      const existing = await db.findUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists' });
      }

      const password_hash = await bcrypt.hash(parsed.data.password, 10);
      const user = await db.createUser({
        email: parsed.data.email,
        password_hash,
        full_name: parsed.data.full_name,
        phone_number: parsed.data.phone_number,
        role: 'user',
      });

      const token = jwt.sign({ userId: user.id, email: user.email }, config.jwt.secret, {
        expiresIn: '7d',
      });

      const { password_hash: _, ...safeUser } = user;
      return res.status(201).json({
        success: true,
        data: { user: safeUser, token },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      }

      const user = await db.findUserByEmail(parsed.data.email);
      if (!user || !user.password_hash) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const isValid = await bcrypt.compare(parsed.data.password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, config.jwt.secret, {
        expiresIn: '7d',
      });

      const { password_hash: _, ...safeUser } = user;
      return res.status(200).json({
        success: true,
        data: { user: safeUser, token },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const { password_hash: _, ...safeUser } = req.user;
    return res.status(200).json({ success: true, data: { user: safeUser } });
  },
};
