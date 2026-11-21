import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { recoveryService } from '../services/recoveryService';

export const recoveryController = {
async createCase(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const {
      incident_date,
      amount_lost,
      transaction_reference,
      bank_name,
      notes,
      investigation_id,
    } = req.body;

    // 1. Required field validation
    if (
      !incident_date ||
      amount_lost === undefined ||
      amount_lost === null
    ) {
      return res.status(400).json({
        success: false,
        error: 'Incident date and amount lost are required',
      });
    }


    // 2. Incident date validation
    const dateMatch =
      typeof incident_date === 'string'
        ? incident_date.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/)
        : null;

    let validCalendarDate = false;

    if (dateMatch) {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = Number(dateMatch[3]);

      const date = new Date(Date.UTC(year, month - 1, day));

      validCalendarDate =
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
    }

    const parsedDate = new Date(incident_date);

    if (
      !dateMatch ||
      !validCalendarDate ||
      Number.isNaN(parsedDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid incident date. Please provide a valid date.',
      });
    }


    // 3. Amount lost validation
    const parsedAmount = Number(amount_lost);

    if (
      (typeof amount_lost === 'string' && amount_lost.trim() === '') ||
      typeof amount_lost === 'boolean' ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: 'Amount lost must be a valid positive number',
      });
    }

    // 4. Create recovery case
    const recoveryCase = await recoveryService.createCase(userId, {
      incident_date,
      amount_lost: parsedAmount,
      transaction_reference,
      bank_name,
      notes,
      investigation_id,
    });

    return res.status(201).json({
      success: true,
      data: recoveryCase,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
},

  async listCases(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const cases = await recoveryService.getCases(userId);
      return res.status(200).json({ success: true, data: cases });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getCaseById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
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
    const userId = req.user!.id;
    const caseId = String(req.params.id);

    // Validate recovery case status
    const allowedStatuses = [
      'OPEN',
      'EVIDENCE_COLLECTED',
      'BANK_CONTACTED',
      'REPORTED',
      'FOLLOW_UP_REQUIRED',
      'CLOSED',
    ];

    if (
      req.body.status !== undefined &&
      !allowedStatuses.includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recovery case status',
        allowedStatuses,
      });
    }

    const updated = await recoveryService.updateCase(
      caseId,
      userId,
      req.body
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Recovery case not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
},
};
