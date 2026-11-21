
import {
  Investigation,
  EvidenceItem,
  ThreatIndicator,
  ExtractedEntities,
  InvestigationRelationship,
  RiskAssessment,
} from '../types';

import { AgentResult } from './agentTypes';

import { messageAnalysisAgent } from './messageAnalysisAgent';
import { urlIntelligenceAgent } from './urlIntelligenceAgent';
import { screenshotAnalysisAgent } from './screenshotAnalysisAgent';
import { paymentInvestigationAgent } from './paymentInvestigationAgent';
import { contextCorrelationAgent } from './contextCorrelationAgent';
import { safetyAdvisoryAgent } from './safetyAdvisoryAgent';

import { riskCalculator } from '../risk-engine/riskCalculator';
import { logger } from '../utils/logger';

export interface OrchestrationResult {
  investigation: Investigation;
  indicators: ThreatIndicator[];
  relationships: InvestigationRelationship[];
  riskAssessment: RiskAssessment;

  agentAuditLogs: Array<{
    agentName: string;
    executionTimeMs: number;
    status: 'COMPLETED' | 'FAILED';
    summary: string;
  }>;
}

interface EvidenceExecutionResult {
  evidence: EvidenceItem;
  result?: AgentResult;
  auditLog: OrchestrationResult['agentAuditLogs'][number];
  uncertainty?: string;
}

const MAX_CONCURRENT_EVIDENCE = 3;

export class CentralInvestigationOrchestrator {
  public async orchestrate(
    investigation: Investigation,
    evidenceList: EvidenceItem[]
  ): Promise<OrchestrationResult> {
    const investigationId = investigation.id;

    logger.info(
      `Starting investigation ${investigationId} with ${evidenceList.length} evidence items.`
    );

    const accumulatedEntities = this.createEmptyEntities();

    const indicators: ThreatIndicator[] = [];
    const relationships: InvestigationRelationship[] = [];

    const agentAuditLogs: OrchestrationResult['agentAuditLogs'] = [];
    const allUncertainties: string[] = [];

    const analyzedEvidence: EvidenceItem[] = [];

    // ========================================
    // PHASE 1: SPECIALIST AGENT DISPATCH
    // ========================================

    // Process evidence in small concurrent batches.
    // This prevents one slow external API or OCR task
    // from blocking every other evidence item.

    for (
      let index = 0;
      index < evidenceList.length;
      index += MAX_CONCURRENT_EVIDENCE
    ) {
      const batch = evidenceList.slice(
        index,
        index + MAX_CONCURRENT_EVIDENCE
      );

      const batchResults = await Promise.all(
        batch.map((evidence) =>
          this.processEvidence(investigationId, evidence)
        )
      );

      for (const execution of batchResults) {
        agentAuditLogs.push(execution.auditLog);

        if (execution.uncertainty) {
          allUncertainties.push(execution.uncertainty);
        }

        analyzedEvidence.push(execution.evidence);

        if (!execution.result) {
          continue;
        }

        indicators.push(...execution.result.indicators);

        this.mergeEntities(
          accumulatedEntities,
          execution.result.extractedEntities
        );

        allUncertainties.push(
          ...execution.result.uncertainties
        );
      }
    }

    // ========================================
    // PHASE 2: INDICATOR DEDUPLICATION
    // ========================================

    const uniqueIndicators = this.deduplicateIndicators(
      indicators
    );

    // ========================================
    // PHASE 3: CONTEXT CORRELATION
    // ========================================

    try {
      const correlationStart = Date.now();

      const correlationResult =
        await contextCorrelationAgent.correlate(
          investigationId,
          analyzedEvidence,
          accumulatedEntities,
          uniqueIndicators
        );

      uniqueIndicators.push(
        ...correlationResult.indicators
      );

      if (correlationResult.relationships) {
        relationships.push(
          ...correlationResult.relationships
        );
      }

      allUncertainties.push(
        ...correlationResult.uncertainties
      );

      agentAuditLogs.push({
        agentName: correlationResult.agentName,
        executionTimeMs: correlationResult.executionTimeMs,
        status: 'COMPLETED',
        summary: correlationResult.summary,
      });

      logger.info(
        `Context correlation completed for ${investigationId} in ${Date.now() - correlationStart}ms.`
      );
    } catch (error) {
      const message = this.getErrorMessage(error);

      logger.error(
        `Context correlation failed for ${investigationId}: ${message}`
      );

      agentAuditLogs.push({
        agentName: 'Context Correlation Agent',
        executionTimeMs: 0,
        status: 'FAILED',
        summary: message,
      });

      allUncertainties.push(
        'Cross-channel evidence correlation failed. Findings are based on individual evidence analysis only.'
      );
    }

    // ========================================
    // PHASE 4: FINAL INDICATOR DEDUPLICATION
    // ========================================

    const finalIndicators = this.deduplicateIndicators(
      uniqueIndicators
    );

    // ========================================
    // PHASE 5: DETERMINISTIC RISK CALCULATION
    // ========================================

    const riskAssessment: RiskAssessment =
      riskCalculator.calculateRisk(
        investigationId,
        finalIndicators,
        analyzedEvidence
      );

    // ========================================
    // PHASE 6: SAFETY ADVISORY
    // ========================================

    const uniqueUncertainties = Array.from(
      new Set(allUncertainties)
    );

    const advisory = safetyAdvisoryAgent.generateAdvisory(
      riskAssessment,
      finalIndicators,
      uniqueUncertainties
    );

    // ========================================
    // PHASE 7: INVESTIGATION STATUS
    // ========================================

    const completedSpecialists = agentAuditLogs.filter(
      (log) =>
        log.status === 'COMPLETED' &&
        log.agentName !== 'Context Correlation Agent'
    ).length;

    const failedSpecialists = agentAuditLogs.filter(
      (log) =>
        log.status === 'FAILED' &&
        log.agentName !== 'Context Correlation Agent'
    ).length;

    const hasSuccessfulAnalysis = completedSpecialists > 0;

    const hasAnalysisFailures = failedSpecialists > 0;

    const investigationStatus =
      hasSuccessfulAnalysis || evidenceList.length === 0
        ? 'COMPLETED'
        : 'IN_PROGRESS';

    if (hasAnalysisFailures) {
      allUncertainties.push(
        `${failedSpecialists} specialist evidence analysis task(s) failed. The final assessment may be incomplete.`
      );
    }

    // ========================================
    // PHASE 8: FINAL INVESTIGATION SYNTHESIS
    // ========================================

    const explanationMarkdown = [
      '### Investigation Assessment',
      advisory.overallAssessment,
      '',
      '### Primary Findings',
      ...advisory.whyFlagged.map((finding) => `- ${finding}`),
      '',
      '### Investigation Coverage',
      `- Evidence submitted: ${evidenceList.length}`,
      `- Specialist tasks completed: ${completedSpecialists}`,
      `- Specialist tasks failed: ${failedSpecialists}`,
      `- Indicators identified: ${finalIndicators.length}`,
      `- Correlations identified: ${relationships.length}`,
      '',
      '### Investigation Limitations',
      ...uniqueUncertainties.map((item) => `- ${item}`),
    ].join('\n');

    const updatedInvestigation: Investigation = {
      ...investigation,

      status: investigationStatus,

      overall_risk_level: riskAssessment.risk_level,
      overall_risk_score: riskAssessment.risk_score,
      confidence_score: riskAssessment.confidence,

      explanation_markdown: explanationMarkdown,

      recommended_actions: advisory.whatToDoNow,

      missing_information: advisory.missingInformationPrompt,

      updated_at: new Date().toISOString(),

      evidence: analyzedEvidence,

      indicators: finalIndicators,

      relationships,

      riskAssessment,
    };

    logger.info(
      `Investigation ${investigationId} finished. Risk: ${riskAssessment.risk_level}, score: ${riskAssessment.risk_score}, indicators: ${finalIndicators.length}.`
    );

    return {
      investigation: updatedInvestigation,
      indicators: finalIndicators,
      relationships,
      riskAssessment,
      agentAuditLogs,
    };
  }

  // ========================================
  // SPECIALIST EVIDENCE DISPATCH
  // ========================================

  private async processEvidence(
    investigationId: string,
    evidence: EvidenceItem
  ): Promise<EvidenceExecutionResult> {
    const startTime = Date.now();

    try {
      let result: AgentResult;

      switch (evidence.evidence_type) {
        case 'MESSAGE': {
          if (!evidence.raw_content?.trim()) {
            throw new Error('Message evidence has no readable text.');
          }

          result = await messageAnalysisAgent.analyze(
            investigationId,
            evidence.id,
            evidence.raw_content
          );

          break;
        }

        case 'URL': {
          if (!evidence.raw_content?.trim()) {
            throw new Error('URL evidence has no URL content.');
          }

          result = await urlIntelligenceAgent.analyze(
            investigationId,
            evidence.id,
            evidence.raw_content
          );

          break;
        }

        case 'SCREENSHOT': {
          if (!evidence.file_path) {
            throw new Error('Screenshot evidence has no file path.');
          }

          result = await screenshotAnalysisAgent.analyze(
            investigationId,
            evidence.id,
            evidence.file_path
          );

          break;
        }

        case 'UPI':
        case 'QR': {
          if (!evidence.raw_content?.trim()) {
            throw new Error('Payment evidence has no readable content.');
          }

          result = await paymentInvestigationAgent.analyze(
            investigationId,
            evidence.id,
            {
              upiId:
                evidence.evidence_type === 'UPI'
                  ? evidence.raw_content
                  : undefined,

              qrPayload:
                evidence.evidence_type === 'QR'
                  ? evidence.raw_content
                  : undefined,

              relatedMessageText: evidence.raw_content,
            }
          );

          break;
        }

        case 'SENDER_ID':
        case 'OTHER': {
          return {
            evidence,
            auditLog: {
              agentName: `${evidence.evidence_type} Analysis`,
              executionTimeMs: Date.now() - startTime,
              status: 'FAILED',
              summary:
                `No dedicated specialist agent is implemented for ${evidence.evidence_type} evidence yet.`,
            },
            uncertainty:
              `${evidence.evidence_type} evidence was submitted but could not be analysed by a dedicated specialist agent.`,
          };
        }

        default: {
          throw new Error('Unsupported evidence type.');
        }
      }

      // Merge the specialist's extracted entities
      // into the original evidence record.
      const updatedEvidence: EvidenceItem = {
        ...evidence,
        extracted_entities: this.mergeEntityCopies(
          evidence.extracted_entities,
          result.extractedEntities
        ),
      };

      return {
        evidence: updatedEvidence,
        result,

        auditLog: {
          agentName: result.agentName,
          executionTimeMs: result.executionTimeMs,
          status: 'COMPLETED',
          summary: result.summary,
        },
      };
    } catch (error) {
      const message = this.getErrorMessage(error);

      logger.error(
        `Evidence ${evidence.id} analysis failed: ${message}`
      );

      return {
        evidence,

        auditLog: {
          agentName: `${evidence.evidence_type} Specialist Agent`,
          executionTimeMs: Date.now() - startTime,
          status: 'FAILED',
          summary: message,
        },

        uncertainty:
          `Evidence ${evidence.id} could not be analysed: ${message}`,
      };
    }
  }

  // ========================================
  // ENTITY MANAGEMENT
  // ========================================

  private createEmptyEntities(): ExtractedEntities {
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

  private mergeEntityCopies(
    existing: ExtractedEntities,
    incoming: ExtractedEntities
  ): ExtractedEntities {
    const merged = this.createEmptyEntities();

    this.mergeEntities(merged, existing);
    this.mergeEntities(merged, incoming);

    return merged;
  }

  private mergeEntities(
    target: ExtractedEntities,
    source: ExtractedEntities
  ): void {
    target.urls = Array.from(
      new Set([...target.urls, ...source.urls])
    );

    target.phones = Array.from(
      new Set([...target.phones, ...source.phones])
    );

    target.emails = Array.from(
      new Set([...target.emails, ...source.emails])
    );

    target.upiIds = Array.from(
      new Set([...target.upiIds, ...source.upiIds])
    );

    target.organizations = Array.from(
      new Set([...target.organizations, ...source.organizations])
    );

    target.amounts = Array.from(
      new Set([...target.amounts, ...source.amounts])
    );

    target.dates = Array.from(
      new Set([...target.dates, ...source.dates])
    );

    target.remoteAccessApps = Array.from(
      new Set([
        ...target.remoteAccessApps,
        ...source.remoteAccessApps,
      ])
    );
  }

  // ========================================
  // INDICATOR DEDUPLICATION
  // ========================================

  private deduplicateIndicators(
    indicators: ThreatIndicator[]
  ): ThreatIndicator[] {
    const unique = new Map<string, ThreatIndicator>();

    for (const indicator of indicators) {
      const key = [
        indicator.category,
        indicator.indicator_type.toLowerCase().trim(),
        indicator.evidence_id || 'no-evidence',
      ].join('|');

      const existing = unique.get(key);

      if (!existing) {
        unique.set(key, { ...indicator });
        continue;
      }

      // Preserve the strongest available finding.
      if (indicator.confidence > existing.confidence) {
        unique.set(key, {
          ...indicator,
          explanation: [
            existing.explanation,
            indicator.explanation,
          ].join(' '),
        });
      }
    }

    return Array.from(unique.values());
  }

  // ========================================
  // ERROR NORMALIZATION
  // ========================================

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'An unknown error occurred during investigation.';
  }
}

export const orchestrator =
  new CentralInvestigationOrchestrator();
