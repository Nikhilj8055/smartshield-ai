
import { db } from '../repositories';
import { orchestrator } from '../agents/orchestrator';
import {
  Investigation,
  EvidenceType,
} from '../types';
import { computeSha256 } from '../utils/hash';
import fs from 'fs';

interface EvidenceInput {
  type: EvidenceType;
  content?: string;
  filePath?: string;
  mimeType?: string;
}

export class InvestigationService {
  /**
   * Validates evidence before storing it.
   */
  private validateEvidence(data: EvidenceInput): void {
    const hasContent = Boolean(data.content?.trim());
    const hasFilePath = Boolean(data.filePath);

    if (!hasContent && !hasFilePath) {
      throw new Error(
        'Please provide evidence content or upload an evidence file.'
      );
    }

    if (hasFilePath) {
      if (data.type !== 'SCREENSHOT') {
        throw new Error(
          'Uploaded image files must use SCREENSHOT evidence type.'
        );
      }

      if (!fs.existsSync(data.filePath!)) {
        throw new Error('Uploaded evidence file could not be found.');
      }

      if (!fs.statSync(data.filePath!).isFile()) {
        throw new Error('Invalid evidence file.');
      }
    }
  }

  /**
   * Creates a new investigation.
   */
  public async createInvestigation(
    userId: string,
    title: string,
    initialEvidence?: EvidenceInput
  ): Promise<Investigation> {
    if (!userId) {
      throw new Error('A valid user ID is required.');
    }

    if (initialEvidence) {
      this.validateEvidence(initialEvidence);
    }

    const investigation = await db.createInvestigation({
      user_id: userId,
      title: title?.trim() || 'New Scam Investigation',
      status: 'IN_PROGRESS',
      overall_risk_level: 'INSUFFICIENT EVIDENCE',
      overall_risk_score: 0,
      confidence_score: 0,
      explanation_markdown: '',
      recommended_actions: [],
      missing_information: [],
    });

    if (initialEvidence) {
      await this.addEvidenceToInvestigation(
        investigation.id,
        userId,
        initialEvidence
      );
    }

    const createdInvestigation =
      await db.getInvestigationById(investigation.id);

    if (!createdInvestigation) {
      throw new Error('Unable to retrieve the created investigation.');
    }

    return createdInvestigation;
  }

  /**
   * Adds evidence and reruns the complete investigation.
   */
  public async addEvidenceToInvestigation(
    investigationId: string,
    userId: string,
    evidenceData: EvidenceInput
  ): Promise<Investigation> {
    if (!userId) {
      throw new Error('A valid user ID is required.');
    }

    this.validateEvidence(evidenceData);

    // 1. Retrieve investigation and verify ownership.
    const currentInvestigation =
      await db.getInvestigationById(investigationId);

    if (!currentInvestigation) {
      throw new Error('Investigation not found.');
    }

    if (currentInvestigation.user_id !== userId) {
      throw new Error(
        'You are not authorized to modify this investigation.'
      );
    }

    // 2. Calculate file hash when an uploaded file exists.
    let fileHash: string | undefined;

    if (evidenceData.filePath) {
      const fileBuffer = fs.readFileSync(evidenceData.filePath);
      fileHash = computeSha256(fileBuffer);
    }

    // 3. Save new evidence.
    await db.addEvidence({
      investigation_id: investigationId,
      user_id: userId,
      evidence_type: evidenceData.type,
      raw_content: evidenceData.content?.trim() || undefined,

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

      reliability_score:
        evidenceData.type === 'SCREENSHOT' ? 0.9 : 1.0,
    });

    // 4. Retrieve ALL accumulated evidence.
    const allEvidence =
      await db.getEvidenceByInvestigation(investigationId);

    // 5. Run the central multi-agent investigation.
    const result = await orchestrator.orchestrate(
      currentInvestigation,
      allEvidence
    );

    // 6. Update the main investigation record.
    const updatedInvestigation = await db.updateInvestigation(
      investigationId,
      {
        status: result.investigation.status,
        overall_risk_level:
          result.investigation.overall_risk_level,
        overall_risk_score:
          result.investigation.overall_risk_score,
        confidence_score:
          result.investigation.confidence_score,
        explanation_markdown:
          result.investigation.explanation_markdown,
        recommended_actions:
          result.investigation.recommended_actions,
        missing_information:
          result.investigation.missing_information,
      }
    );

    if (!updatedInvestigation) {
      throw new Error(
        'Unable to update the investigation results.'
      );
    }

    // 7. Replace old findings with the latest analysis results.
    await db.replaceIndicatorsForInvestigation(
      investigationId,
      result.indicators
    );

    await db.replaceRelationshipsForInvestigation(
      investigationId,
      result.relationships
    );

    // 8. Save the latest risk assessment.
    await db.saveRiskAssessment(result.riskAssessment);

    // 9. Return the complete updated investigation.
    const finalInvestigation =
      await db.getInvestigationById(investigationId);

    if (!finalInvestigation) {
      throw new Error(
        'Unable to retrieve the updated investigation.'
      );
    }

    return finalInvestigation;
  }

  /**
   * Retrieves an investigation.
   */
  public async getInvestigation(
    id: string
  ): Promise<Investigation | null> {
    return db.getInvestigationById(id);
  }

  /**
   * Lists investigations belonging to a user.
   */
  public async listUserInvestigations(
    userId: string
  ): Promise<Investigation[]> {
    return db.listInvestigationsByUserId(userId);
  }

  /**
   * Deletes an investigation after verifying ownership.
   */
  public async deleteInvestigation(
    id: string,
    userId: string
  ): Promise<boolean> {
    const investigation = await db.getInvestigationById(id);

    if (!investigation) {
      return false;
    }

    if (investigation.user_id !== userId) {
      return false;
    }

    return db.deleteInvestigation(id);
  }
}

export const investigationService = new InvestigationService();
