import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { recoveryService } from '../services/recoveryService';

export const recoveryController = {
  async createCase(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const { incident_date, amount_lost, transaction_reference, bank_name, notes, investigation_id } = req.body;

      if (!incident_date || amount_lost === undefined) {
        return res.status(400).json({ success: false, error: 'Incident date and amount lost are required' });
      }

      const recoveryCase = await recoveryService.createCase(userId, {
        incident_date,
        amount_lost: Number(amount_lost),
        transaction_reference,
        bank_name,
        notes,
        investigation_id,
      });

      return res.status(201).json({ success: true, data: recoveryCase });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async listCases(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const cases = await recoveryService.getCases(userId);
      return res.status(200).json({ success: true, data: cases });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getCaseById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const caseId = String(req.params.id);
      const c = await recoveryService.getCaseById(caseId, userId);
      if (!c) {
        return res.status(404).json({ success: false, error: 'Recovery case not found' });
      }
      return res.status(200).json({ success: true, data: c });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateCase(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const caseId = String(req.params.id);
      const updated = await recoveryService.updateCase(caseId, userId, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Recovery case not found or unauthorized' });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
