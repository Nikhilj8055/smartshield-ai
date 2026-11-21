
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { z } from 'zod';

import { messageAnalysisAgent } from '../agents/messageAnalysisAgent';
import { urlIntelligenceAgent } from '../agents/urlIntelligenceAgent';
import { screenshotAnalysisAgent } from '../agents/screenshotAnalysisAgent';

import { riskCalculator } from '../risk-engine/riskCalculator';
import { safetyAdvisoryAgent } from '../agents/safetyAdvisoryAgent';

import { EvidenceItem } from '../types';
import { AgentResult } from '../agents/agentTypes';

type SharedAnalysisResult = Pick<
  AgentResult,
  'extractedEntities' | 'indicators' | 'uncertainties'
>;

const messageSchema = z.object({
  text: z.string().trim().min(1).max(10000),
});

const urlSchema = z.object({
  url: z.string().trim().min(1).max(2048).url(),
});

const screenshotTextSchema = z.object({
  userCorrectedText: z.string().max(10000).optional(),
});

function createAnalysisResponse(
  investigationId: string,
  evidenceId: string,
  evidenceType: EvidenceItem['evidence_type'],
  rawContent: string,
  result: SharedAnalysisResult,
  reliabilityScore: number,
  extraData: Record<string, unknown> = {}
) {
  const evidenceItem: EvidenceItem = {
    id: evidenceId,
    investigation_id: investigationId,
    user_id: 'guest',
    evidence_type: evidenceType,
    raw_content: rawContent,
    extracted_entities: result.extractedEntities,
    reliability_score: reliabilityScore,
    created_at: new Date().toISOString(),
  };

  const risk = riskCalculator.calculateRisk(
    investigationId,
    result.indicators,
    [evidenceItem]
  );

  const advisory = safetyAdvisoryAgent.generateAdvisory(
    risk,
    result.indicators,
    result.uncertainties
  );

  return {
    ...extraData,
    riskScore: risk.risk_score,
    riskLevel: risk.risk_level,
    confidence: risk.confidence,
    indicators: result.indicators,
    extractedEntities: result.extractedEntities,
    advisory,
    uncertainties: result.uncertainties,
  };
}

function sendAnalysisError(
  res: Response,
  operation: string,
  error: unknown
) {
  console.error(
    `[ANALYSIS ${operation} ERROR]`,
    error instanceof Error ? error.message : error
  );

  return res.status(500).json({
    success: false,
    error: `${operation} failed. Please try again.`,
  });
}

export const analysisController = {
  async analyzeMessage(req: Request, res: Response) {
    try {
      const parsed = messageSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0].message,
        });
      }

      const investigationId = uuidv4();
      const evidenceId = uuidv4();

      const result = await messageAnalysisAgent.analyze(
        investigationId,
        evidenceId,
        parsed.data.text
      );

      const data = createAnalysisResponse(
        investigationId,
        evidenceId,
        'MESSAGE',
        parsed.data.text,
        result,
        1.0
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: unknown) {
      return sendAnalysisError(res, 'MESSAGE ANALYSIS', error);
    }
  },

  async analyzeUrl(req: Request, res: Response) {
    try {
      const parsed = urlSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0].message,
        });
      }

      const normalizedUrl = new URL(parsed.data.url);

      if (!['http:', 'https:'].includes(normalizedUrl.protocol)) {
        return res.status(400).json({
          success: false,
          error: 'Only HTTP and HTTPS URLs are supported.',
        });
      }

      const investigationId = uuidv4();
      const evidenceId = uuidv4();

      const result = await urlIntelligenceAgent.analyze(
        investigationId,
        evidenceId,
        normalizedUrl.toString()
      );

      const data = createAnalysisResponse(
        investigationId,
        evidenceId,
        'URL',
        normalizedUrl.toString(),
        result,
        1.0
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: unknown) {
      return sendAnalysisError(res, 'URL ANALYSIS', error);
    }
  },

  async analyzeScreenshot(req: Request, res: Response) {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Image screenshot file is required.',
      });
    }

    try {
      const parsed = screenshotTextSchema.safeParse(req.body);

      if (!parsed.success) {
        await fs.unlink(file.path).catch(() => undefined);

        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0].message,
        });
      }

      const investigationId = uuidv4();
      const evidenceId = uuidv4();

      const result = await screenshotAnalysisAgent.analyze(
        investigationId,
        evidenceId,
        file.path,
        parsed.data.userCorrectedText
      );

      const data = createAnalysisResponse(
        investigationId,
        evidenceId,
        'SCREENSHOT',
        result.extractedOcrText,
        result,
        0.9,
        {
          extractedOcrText: result.extractedOcrText,
          fileHash: result.fileHash,
        }
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: unknown) {
      await fs.unlink(file.path).catch(() => undefined);

      return sendAnalysisError(res, 'SCREENSHOT ANALYSIS', error);
    }
  },
};
