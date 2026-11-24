
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { z } from 'zod';

import { orchestrator } from '../agents/orchestrator';
import {
  Investigation,
  EvidenceItem,
  ExtractedEntities,
} from '../types';

const guestInvestigationSchema = z.object({
  message: z.string().trim().max(10000).optional(),
  url: z.string().trim().max(2048).url().optional(),
});

function createEmptyEntities(): ExtractedEntities {
  return {
    urls: [],
    phones: [],
    emails: [],
    upiIds: [],
    organizations: [],
    amounts: [],
    dates: [],
    remoteAccessApps: [],
  };
}

export const guestInvestigationController = {
  async analyze(req: Request, res: Response) {
    const file = req.file;

    try {
      const parsed = guestInvestigationSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0].message,
        });
      }

      const { message, url } = parsed.data;

      if (!message && !url && !file) {
        return res.status(400).json({
          success: false,
          error: 'Submit a message, URL or screenshot to investigate.',
        });
      }

      let normalizedUrl: string | undefined;

      if (url) {
        const parsedUrl = new URL(url);

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return res.status(400).json({
            success: false,
            error: 'Only HTTP and HTTPS URLs are supported.',
          });
        }

        normalizedUrl = parsedUrl.toString();
      }

      const investigationId = uuidv4();
      const now = new Date().toISOString();

      const investigation: Investigation = {
        id: investigationId,
        user_id: 'guest',
        title: 'Guest Scam Investigation',
        status: 'IN_PROGRESS',
        overall_risk_level: 'INSUFFICIENT EVIDENCE',
        overall_risk_score: 0,
        confidence_score: 0,
        explanation_markdown: '',
        recommended_actions: [],
        missing_information: [],
        created_at: now,
        updated_at: now,
      };

      const evidenceList: EvidenceItem[] = [];

      if (message) {
        evidenceList.push({
          id: uuidv4(),
          investigation_id: investigationId,
          user_id: 'guest',
          evidence_type: 'MESSAGE',
          raw_content: message,
          extracted_entities: createEmptyEntities(),
          reliability_score: 1,
          created_at: now,
        });
      }

      if (normalizedUrl) {
        evidenceList.push({
          id: uuidv4(),
          investigation_id: investigationId,
          user_id: 'guest',
          evidence_type: 'URL',
          raw_content: normalizedUrl,
          extracted_entities: createEmptyEntities(),
          reliability_score: 1,
          created_at: now,
        });
      }

      if (file) {
        evidenceList.push({
          id: uuidv4(),
          investigation_id: investigationId,
          user_id: 'guest',
          evidence_type: 'SCREENSHOT',
          file_path: file.path,
          mime_type: file.mimetype,
          extracted_entities: createEmptyEntities(),
          reliability_score: 0.9,
          created_at: now,
        });
      }

      const result = await orchestrator.orchestrate(
        investigation,
        evidenceList
      );

      return res.status(200).json({
        success: true,
        data: {
          investigationId,
          investigation: result.investigation,
          riskScore: result.riskAssessment.risk_score,
          riskLevel: result.riskAssessment.risk_level,
          confidence: result.riskAssessment.confidence,
          indicators: result.indicators,
          relationships: result.relationships,
          riskAssessment: result.riskAssessment,
          agentAuditLogs: result.agentAuditLogs,
          evidence: result.investigation.evidence,
        },
      });
    } catch (error: unknown) {
      console.error(
        '[GUEST INVESTIGATION ERROR]',
        error instanceof Error ? error.message : error
      );

      return res.status(500).json({
        success: false,
        error: 'Investigation failed. Please try again.',
      });
    } finally {
      if (file?.path) {
        await fs.unlink(file.path).catch(() => undefined);
      }
    }
  },
};
