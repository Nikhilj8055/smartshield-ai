import { Request, Response } from 'express';
import { messageAnalysisAgent } from '../agents/messageAnalysisAgent';
import { urlIntelligenceAgent } from '../agents/urlIntelligenceAgent';
import { screenshotAnalysisAgent } from '../agents/screenshotAnalysisAgent';
import { riskCalculator } from '../risk-engine/riskCalculator';
import { safetyAdvisoryAgent } from '../agents/safetyAdvisoryAgent';
import { v4 as uuidv4 } from 'uuid';

export const analysisController = {
  async analyzeMessage(req: Request, res: Response) {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, error: 'Text content is required' });
      }

      const invId = uuidv4();
      const evId = uuidv4();
      const result = await messageAnalysisAgent.analyze(invId, evId, text);

      const evidenceItem = {
        id: evId,
        investigation_id: invId,
        user_id: 'guest',
        evidence_type: 'MESSAGE' as const,
        raw_content: text,
        extracted_entities: result.extractedEntities,
        reliability_score: 1.0,
        created_at: new Date().toISOString(),
      };

      const risk = riskCalculator.calculateRisk(invId, result.indicators, [evidenceItem]);
      const advisory = safetyAdvisoryAgent.generateAdvisory(risk, result.indicators, result.uncertainties);

      return res.status(200).json({
        success: true,
        data: {
          riskScore: risk.risk_score,
          riskLevel: risk.risk_level,
          confidence: risk.confidence,
          indicators: result.indicators,
          extractedEntities: result.extractedEntities,
          advisory,
          uncertainties: result.uncertainties,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async analyzeUrl(req: Request, res: Response) {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'URL is required' });
      }

      const invId = uuidv4();
      const evId = uuidv4();
      const result = await urlIntelligenceAgent.analyze(invId, evId, url);

      const evidenceItem = {
        id: evId,
        investigation_id: invId,
        user_id: 'guest',
        evidence_type: 'URL' as const,
        raw_content: url,
        extracted_entities: result.extractedEntities,
        reliability_score: 1.0,
        created_at: new Date().toISOString(),
      };

      const risk = riskCalculator.calculateRisk(invId, result.indicators, [evidenceItem]);
      const advisory = safetyAdvisoryAgent.generateAdvisory(risk, result.indicators, result.uncertainties);

      return res.status(200).json({
        success: true,
        data: {
          riskScore: risk.risk_score,
          riskLevel: risk.risk_level,
          confidence: risk.confidence,
          indicators: result.indicators,
          extractedEntities: result.extractedEntities,
          advisory,
          uncertainties: result.uncertainties,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async analyzeScreenshot(req: Request, res: Response) {
    try {
      const file = req.file;
      const { userCorrectedText } = req.body;

      if (!file) {
        return res.status(400).json({ success: false, error: 'Image screenshot file is required' });
      }

      const invId = uuidv4();
      const evId = uuidv4();
      const result = await screenshotAnalysisAgent.analyze(invId, evId, file.path, userCorrectedText);

      const evidenceItem = {
        id: evId,
        investigation_id: invId,
        user_id: 'guest',
        evidence_type: 'SCREENSHOT' as const,
        raw_content: result.extractedOcrText,
        extracted_entities: result.extractedEntities,
        file_path: file.path,
        file_hash: result.fileHash,
        reliability_score: 0.9,
        created_at: new Date().toISOString(),
      };

      const risk = riskCalculator.calculateRisk(invId, result.indicators, [evidenceItem]);
      const advisory = safetyAdvisoryAgent.generateAdvisory(risk, result.indicators, result.uncertainties);

      return res.status(200).json({
        success: true,
        data: {
          extractedOcrText: result.extractedOcrText,
          fileHash: result.fileHash,
          riskScore: risk.risk_score,
          riskLevel: risk.risk_level,
          confidence: risk.confidence,
          indicators: result.indicators,
          extractedEntities: result.extractedEntities,
          advisory,
          uncertainties: result.uncertainties,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
