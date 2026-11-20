import { db } from '../repositories';
import { orchestrator } from '../agents/orchestrator';
import { Investigation, EvidenceItem, EvidenceType } from '../types';
import { computeSha256 } from '../utils/hash';
import fs from 'fs';

export class InvestigationService {
  public async createInvestigation(
    userId: string,
    title: string,
    initialEvidence?: {
      type: EvidenceType;
      content?: string;
      filePath?: string;
      mimeType?: string;
    }
  ): Promise<Investigation> {
    const inv = await db.createInvestigation({
      user_id: userId,
      title: title || 'New Scam Investigation',
      status: 'IN_PROGRESS',
      overall_risk_level: 'INSUFFICIENT EVIDENCE',
      overall_risk_score: 0,
      confidence_score: 0,
      explanation_markdown: '',
      recommended_actions: [],
      missing_information: [],
    });

    if (initialEvidence) {
      await this.addEvidenceToInvestigation(inv.id, userId, initialEvidence);
    }

    return (await db.getInvestigationById(inv.id))!;
  }

  public async addEvidenceToInvestigation(
    investigationId: string,
    userId: string,
    evidenceData: {
      type: EvidenceType;
      content?: string;
      filePath?: string;
      mimeType?: string;
    }
  ): Promise<Investigation> {
    let fileHash: string | undefined = undefined;
    if (evidenceData.filePath && fs.existsSync(evidenceData.filePath)) {
      fileHash = computeSha256(fs.readFileSync(evidenceData.filePath));
    }

    await db.addEvidence({
      investigation_id: investigationId,
      user_id: userId,
      evidence_type: evidenceData.type,
      raw_content: evidenceData.content,
      extracted_entities: {
        urls: [],
        phones: [],
        emails: [],
        upiIds: [],
        organizations: [],
        amounts: [],
        dates: [],
        remoteAccessApps: [],
      },
      file_path: evidenceData.filePath,
      file_hash: fileHash,
      mime_type: evidenceData.mimeType,
      reliability_score: evidenceData.type === 'SCREENSHOT' ? 0.9 : 1.0,
    });

    // Re-run orchestration across all accumulated evidence in this investigation
    const currentInv = await db.getInvestigationById(investigationId);
    const allEvidence = await db.getEvidenceByInvestigation(investigationId);

    if (currentInv) {
      const result = await orchestrator.orchestrate(currentInv, allEvidence);

      await db.updateInvestigation(investigationId, {
        status: result.investigation.status,
        overall_risk_level: result.investigation.overall_risk_level,
        overall_risk_score: result.investigation.overall_risk_score,
        confidence_score: result.investigation.confidence_score,
        explanation_markdown: result.investigation.explanation_markdown,
        recommended_actions: result.investigation.recommended_actions,
        missing_information: result.investigation.missing_information,
      });

      await db.saveIndicators(result.indicators);
      await db.saveRelationships(result.relationships);
      await db.saveRiskAssessment(result.riskAssessment);
    }

    return (await db.getInvestigationById(investigationId))!;
  }

  public async getInvestigation(id: string): Promise<Investigation | null> {
    return db.getInvestigationById(id);
  }

  public async listUserInvestigations(userId: string): Promise<Investigation[]> {
    return db.listInvestigationsByUserId(userId);
  }

  public async deleteInvestigation(id: string, userId: string): Promise<boolean> {
    const inv = await db.getInvestigationById(id);
    if (!inv || inv.user_id !== userId) return false;
    return db.deleteInvestigation(id);
  }
}

export const investigationService = new InvestigationService();
