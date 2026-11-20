import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { investigationService } from '../services/investigationService';
import { z } from 'zod';

const createInvestigationSchema = z.object({
  title: z.string().min(1).default('New Scam Investigation'),
  type: z.enum(['MESSAGE', 'URL', 'SCREENSHOT', 'UPI', 'QR', 'OTHER']).default('MESSAGE'),
  content: z.string().optional(),
});

export const investigationController = {
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = createInvestigationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      }

      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
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

      return res.status(201).json({ success: true, data: inv });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const invId = String(req.params.id);
      const inv = await investigationService.getInvestigation(invId);
      if (!inv) {
        return res.status(404).json({ success: false, error: 'Investigation not found' });
      }
      return res.status(200).json({ success: true, data: inv });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const list = await investigationService.listUserInvestigations(userId);
      return res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async addEvidence(req: AuthenticatedRequest, res: Response) {
    try {
      const invId = String(req.params.id);
      const { type, content } = req.body;
      const file = req.file;

      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const updated = await investigationService.addEvidenceToInvestigation(invId, userId, {
        type: type || (file ? 'SCREENSHOT' : 'MESSAGE'),
        content: content,
        filePath: file?.path,
        mimeType: file?.mimetype,
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const invId = String(req.params.id);
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const deleted = await investigationService.deleteInvestigation(invId, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Investigation not found or unauthorized' });
      }
      return res.status(200).json({ success: true, message: 'Investigation deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
