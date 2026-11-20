import {
  Investigation,
  EvidenceItem,
  ThreatIndicator,
  ExtractedEntities,
  InvestigationRelationship,
  RiskAssessment,
} from '../types';
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

export class CentralInvestigationOrchestrator {
  public async orchestrate(
    investigation: Investigation,
    evidenceList: EvidenceItem[]
  ): Promise<OrchestrationResult> {
    logger.info(`Orchestrating investigation ${investigation.id} with ${evidenceList.length} evidence items.`);

    const indicators: ThreatIndicator[] = [];
    const allRelationships: InvestigationRelationship[] = [];
    const accumulatedEntities: ExtractedEntities = {
      urls: [],
      phones: [],
      emails: [],
      upiIds: [],
      organizations: [],
      amounts: [],
      dates: [],
      remoteAccessApps: [],
    };
    const agentAuditLogs: OrchestrationResult['agentAuditLogs'] = [];
    const allUncertainties: string[] = [];

    // Phase 1: Dispatch Specialist Agents by Evidence Type
    for (const ev of evidenceList) {
      try {
        if (ev.evidence_type === 'MESSAGE' && ev.raw_content) {
          const res = await messageAnalysisAgent.analyze(investigation.id, ev.id, ev.raw_content);
          indicators.push(...res.indicators);
          this.mergeEntities(accumulatedEntities, res.extractedEntities);
          allUncertainties.push(...res.uncertainties);
          agentAuditLogs.push({
            agentName: res.agentName,
            executionTimeMs: res.executionTimeMs,
            status: 'COMPLETED',
            summary: res.summary,
          });
        } else if (ev.evidence_type === 'URL' && ev.raw_content) {
          const res = await urlIntelligenceAgent.analyze(investigation.id, ev.id, ev.raw_content);
          indicators.push(...res.indicators);
          this.mergeEntities(accumulatedEntities, res.extractedEntities);
          allUncertainties.push(...res.uncertainties);
          agentAuditLogs.push({
            agentName: res.agentName,
            executionTimeMs: res.executionTimeMs,
            status: 'COMPLETED',
            summary: res.summary,
          });
        } else if (ev.evidence_type === 'SCREENSHOT' && ev.file_path) {
          const res = await screenshotAnalysisAgent.analyze(investigation.id, ev.id, ev.file_path);
          indicators.push(...res.indicators);
          this.mergeEntities(accumulatedEntities, res.extractedEntities);
          allUncertainties.push(...res.uncertainties);
          agentAuditLogs.push({
            agentName: res.agentName,
            executionTimeMs: res.executionTimeMs,
            status: 'COMPLETED',
            summary: res.summary,
          });
        } else if (ev.evidence_type === 'UPI' || ev.evidence_type === 'QR') {
          const res = await paymentInvestigationAgent.analyze(investigation.id, ev.id, {
            upiId: ev.evidence_type === 'UPI' ? ev.raw_content : undefined,
            qrPayload: ev.evidence_type === 'QR' ? ev.raw_content : undefined,
            relatedMessageText: ev.raw_content,
          });
          indicators.push(...res.indicators);
          this.mergeEntities(accumulatedEntities, res.extractedEntities);
          allUncertainties.push(...res.uncertainties);
          agentAuditLogs.push({
            agentName: res.agentName,
            executionTimeMs: res.executionTimeMs,
            status: 'COMPLETED',
            summary: res.summary,
          });
        }
      } catch (err: any) {
        logger.error(`Error processing evidence item ${ev.id}: ${err.message}`);
        agentAuditLogs.push({
          agentName: `Specialist Agent (${ev.evidence_type})`,
          executionTimeMs: 0,
          status: 'FAILED',
          summary: `Failed to analyze evidence: ${err.message}`,
        });
      }
    }

    // Phase 2: Context Correlation Agent (Entity Graph & Cross-Channel Discrepancy)
    try {
      const corrRes = await contextCorrelationAgent.correlate(
        investigation.id,
        evidenceList,
        accumulatedEntities,
        indicators
      );
      indicators.push(...corrRes.indicators);
      if (corrRes.relationships) {
        allRelationships.push(...corrRes.relationships);
      }
      allUncertainties.push(...corrRes.uncertainties);
      agentAuditLogs.push({
        agentName: corrRes.agentName,
        executionTimeMs: corrRes.executionTimeMs,
        status: 'COMPLETED',
        summary: corrRes.summary,
      });
    } catch (err: any) {
      logger.error(`Context correlation failed: ${err.message}`);
    }

    // Phase 3: Deterministic Risk Calculation
    const riskAssessment = riskCalculator.calculateRisk(investigation.id, indicators, evidenceList);

    // Phase 4: Safety Advisory Agent (Actionable Guidance & Explanation)
    const advisory = safetyAdvisoryAgent.generateAdvisory(
      riskAssessment,
      indicators,
      Array.from(new Set(allUncertainties))
    );

    // Phase 5: Synthesis of Final Investigation Record
    const explanationMarkdown = `### Investigation Assessment\n${advisory.overallAssessment}\n\n### Primary Findings\n${advisory.whyFlagged.map((f) => `- ${f}`).join('\n')}`;

    const updatedInvestigation: Investigation = {
      ...investigation,
      status: 'COMPLETED',
      overall_risk_level: riskAssessment.risk_level,
      overall_risk_score: riskAssessment.risk_score,
      confidence_score: riskAssessment.confidence,
      explanation_markdown: explanationMarkdown,
      recommended_actions: advisory.whatToDoNow,
      missing_information: advisory.missingInformationPrompt,
      updated_at: new Date().toISOString(),
      indicators,
      relationships: allRelationships,
      riskAssessment,
    };

    return {
      investigation: updatedInvestigation,
      indicators,
      relationships: allRelationships,
      riskAssessment,
      agentAuditLogs,
    };
  }

  private mergeEntities(target: ExtractedEntities, source: ExtractedEntities) {
    target.urls = Array.from(new Set([...target.urls, ...source.urls]));
    target.phones = Array.from(new Set([...target.phones, ...source.phones]));
    target.emails = Array.from(new Set([...target.emails, ...source.emails]));
    target.upiIds = Array.from(new Set([...target.upiIds, ...source.upiIds]));
    target.organizations = Array.from(new Set([...target.organizations, ...source.organizations]));
    target.amounts = Array.from(new Set([...target.amounts, ...source.amounts]));
    target.dates = Array.from(new Set([...target.dates, ...source.dates]));
    target.remoteAccessApps = Array.from(new Set([...target.remoteAccessApps, ...source.remoteAccessApps]));
  }
}

export const orchestrator = new CentralInvestigationOrchestrator();
