
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth';
import { investigationService } from '../services/investigationService';

// ========================================
// INPUT VALIDATION
// ========================================

const createInvestigationSchema = z.object({
  title: z.string().trim().min(1).max(150).default('New Scam Investigation'),

  type: z.enum([
    'MESSAGE',
    'URL',
    'SCREENSHOT',
    'UPI',
    'QR',
    'OTHER',
  ]).default('MESSAGE'),

  content: z.string().trim().max(10000).optional(),
});

const addEvidenceSchema = z.object({
  type: z.enum([
    'MESSAGE',
    'URL',
    'SCREENSHOT',
    'UPI',
    'QR',
    'OTHER',
  ]).optional(),

  content: z.string().trim().max(10000).optional(),
});

// ========================================
// USER HELPERS
// ========================================

function getUserId(req: AuthenticatedRequest): string | null {
  return req.user?.id || null;
}

// ========================================
// INVESTIGATION CONTROLLER
// ========================================

export const investigationController = {

  // ======================================
  // CREATE INVESTIGATION
  // ======================================

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = createInvestigationSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0].message,
        });
      }

      // Support both logged-in and guest users.
      const userId = getUserId(req) || `guest-${uuidv4()}`;

      const inv = await investigationService.createInvestigation(
        userId,
        parsed.data.title,
        parsed.data.content
          ? {
              type: parsed.data.type,
              content: parsed.data.content,
            }
          : undefined
      );

      return res.status(201).json({
        success: true,
        data: inv,
      });

    } catch (err: unknown) {
      console.error('Create investigation error:', err);

      return res.status(500).json({
        success: false,
        error: 'Unable to create investigation.',
      });
    }
  },

  // ======================================
  // GET INVESTIGATION BY ID
  // ======================================

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = getUserId(req);
      const investigationId = String(req.params.id);

      const inv = await investigationService.getInvestigation(
        investigationId
      );

      if (!inv) {
        return res.status(404).json({
          success: false,
          error: 'Investigation not found.',
        });
      }

      if (userId) {
        // Authenticated users can only access their own investigations.
        if (inv.user_id !== userId) {
          return res.status(403).json({
            success: false,
            error: 'You are not authorized to access this investigation.',
          });
        }
      } else {
        // Allow guest access only to guest-created investigations.
        if (!inv.user_id.startsWith('guest-')) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required.',
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: inv,
      });

    } catch (err: unknown) {
      console.error('Get investigation error:', err);

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve investigation.',
      });
    }
  },

  // ======================================
  // LIST INVESTIGATIONS
  // ======================================

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
      }

      const investigations =
        await investigationService.listUserInvestigations(userId);

      return res.status(200).json({
        success: true,
        data: investigations,
      });

    } catch (err: unknown) {
      console.error('List investigations error:', err);

      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve investigations.',
      });
    }
  },

  // ======================================
  // ADD EVIDENCE
  // ======================================

  async addEvidence(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
      }

      const parsed = addEvidenceSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0].message,
        });
      }

      const file = req.file;
      const { type, content } = parsed.data;

      if (!file && !content) {
        return res.status(400).json({
          success: false,
          error: 'Please provide message content or upload an evidence image.',
        });
      }

      const evidenceType = type || (file ? 'SCREENSHOT' : 'MESSAGE');

      if (file && evidenceType !== 'SCREENSHOT') {
        return res.status(400).json({
          success: false,
          error: 'Uploaded images must use SCREENSHOT evidence type.',
        });
      }

      const updated =
        await investigationService.addEvidenceToInvestigation(
          String(req.params.id),
          userId,
          {
            type: evidenceType,
            content,
            filePath: file?.path,
            mimeType: file?.mimetype,
          }
        );

      return res.status(200).json({
        success: true,
        data: updated,
      });

    } catch (err: unknown) {
      console.error('Add evidence error:', err);

      return res.status(500).json({
        success: false,
        error: 'Unable to add evidence to investigation.',
      });
    }
  },

  // ======================================
  // DELETE INVESTIGATION
  // ======================================

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
      }

      const deleted = await investigationService.deleteInvestigation(
        String(req.params.id),
        userId
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Investigation not found.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Investigation deleted successfully.',
      });

    } catch (err: unknown) {
      console.error('Delete investigation error:', err);

      return res.status(500).json({
        success: false,
        error: 'Unable to delete investigation.',
      });
    }
  },
};
