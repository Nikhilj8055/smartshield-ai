import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { scamPatternService } from '../services/scamPatternService';

export const scamPatternController = {
  async getClusters(req: AuthenticatedRequest, res: Response) {
    try {
      const clusters = await scamPatternService.getAllClusters();
      return res.status(200).json({ success: true, data: clusters });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async report(req: AuthenticatedRequest, res: Response) {
    try {
      const { text, consentGiven } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, error: 'Report text is required' });
      }

      if (!consentGiven) {
        return res.status(400).json({
          success: false,
          error: 'Explicit consent is required to anonymize and index scam reports.',
        });
      }

      const report = await scamPatternService.reportScam(req.user?.id, text, true);
      return res.status(201).json({ success: true, data: report });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
