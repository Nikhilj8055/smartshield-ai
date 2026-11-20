import { AgentResult } from './agentTypes';
import {
  ThreatIndicator,
  ExtractedEntities,
  InvestigationRelationship,
  EvidenceItem,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ContextCorrelationAgent {
  public readonly name = 'Context Correlation Agent';

  public async correlate(
    investigationId: string,
    evidenceList: EvidenceItem[],
    accumulatedEntities: ExtractedEntities,
    indicators: ThreatIndicator[]
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const relationships: InvestigationRelationship[] = [];
    const correlationIndicators: ThreatIndicator[] = [];
    const uncertainties: string[] = [];

    // 1. Correlate Organizations with URLs & Phones
    const uniqueOrgs = Array.from(new Set(accumulatedEntities.organizations));
    const uniqueUrls = Array.from(new Set(accumulatedEntities.urls));
    const uniquePhones = Array.from(new Set(accumulatedEntities.phones));
    const uniqueUpis = Array.from(new Set(accumulatedEntities.upiIds));
    const uniqueRemoteApps = Array.from(new Set(accumulatedEntities.remoteAccessApps));

    // Connect Message -> Entities
    for (const ev of evidenceList) {
      const evId = ev.id;
      const evLabel = `Evidence (${ev.evidence_type})`;

      // Link URLs found in this evidence
      for (const url of ev.extracted_entities.urls || []) {
        relationships.push({
          id: uuidv4(),
          investigation_id: investigationId,
          source_entity_id: evId,
          source_entity_type: 'EVIDENCE',
          source_label: evLabel,
          target_entity_id: `url_${url}`,
          target_entity_type: 'URL',
          target_label: url,
          relationship_type: 'CONTAINS_URL',
          confidence: 95,
          evidence_id: evId,
        });
      }

      // Link Phones
      for (const phone of ev.extracted_entities.phones || []) {
        relationships.push({
          id: uuidv4(),
          investigation_id: investigationId,
          source_entity_id: evId,
          source_entity_type: 'EVIDENCE',
          source_label: evLabel,
          target_entity_id: `phone_${phone}`,
          target_entity_type: 'PHONE',
          target_label: phone,
          relationship_type: 'ASSOCIATED_PHONE',
          confidence: 95,
          evidence_id: evId,
        });
      }

      // Link UPI IDs
      for (const upi of ev.extracted_entities.upiIds || []) {
        relationships.push({
          id: uuidv4(),
          investigation_id: investigationId,
          source_entity_id: evId,
          source_entity_type: 'EVIDENCE',
          source_label: evLabel,
          target_entity_id: `upi_${upi}`,
          target_entity_type: 'UPI_VPA',
          target_label: upi,
          relationship_type: 'REQUESTS_PAYMENT_TO',
          confidence: 90,
          evidence_id: evId,
        });
      }

      // Link Organizations
      for (const org of ev.extracted_entities.organizations || []) {
        relationships.push({
          id: uuidv4(),
          investigation_id: investigationId,
          source_entity_id: evId,
          source_entity_type: 'EVIDENCE',
          source_label: evLabel,
          target_entity_id: `org_${org}`,
          target_entity_type: 'ORGANIZATION',
          target_label: org,
          relationship_type: 'SENDER_CLAIMS_TO_REPRESENT',
          confidence: 85,
          evidence_id: evId,
        });
      }
    }

    // Cross-channel Discrepancy Analysis:
    // If sender claims to represent a major bank/institution (e.g. SBI) but requests payment to a personal UPI or links to an unverified domain
    if (uniqueOrgs.length > 0 && uniqueUpis.length > 0) {
      const personalUpiDetected = uniqueUpis.some((u) => !u.includes('.merchant') && !u.includes('official'));
      if (personalUpiDetected) {
        correlationIndicators.push({
          id: uuidv4(),
          investigation_id: investigationId,
          indicator_type: 'Cross-Channel Entity Inconsistency',
          category: 'IDENTITY_DECEPTION',
          severity: 'HIGH',
          confidence: 90,
          explanation: `Communication claims representation of "${uniqueOrgs.join(', ')}", but financial settlement routes through personal VPA (${uniqueUpis.join(', ')}).`,
          source: 'Context Correlation Agent (Discrepancy Engine)',
          verification_status: 'AUTOMATED_MATCH',
        });
      }
    }

    // Remote app linked with banking claim
    if (uniqueOrgs.length > 0 && uniqueRemoteApps.length > 0) {
      correlationIndicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        indicator_type: 'Impersonation Paired With Remote-Control Request',
        category: 'REMOTE_ACCESS',
        severity: 'CRITICAL',
        confidence: 95,
        explanation: `Claim of representing ${uniqueOrgs.join(', ')} paired with instructions to install remote access app (${uniqueRemoteApps.join(', ')}).`,
        source: 'Context Correlation Agent (Cross-Vector Matcher)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    if (evidenceList.length < 2) {
      uncertainties.push('Single evidence item available. Cross-channel correlation improves when multiple items (e.g. SMS + URL + UPI) are linked.');
    }

    return {
      agentName: this.name,
      executionTimeMs: Date.now() - startTime,
      confidence: 88,
      extractedEntities: accumulatedEntities,
      indicators: correlationIndicators,
      relationships,
      summary: `Constructed Scam Journey Graph with ${relationships.length} entity edge(s) across ${evidenceList.length} evidence source(s).`,
      uncertainties,
    };
  }
}

export const contextCorrelationAgent = new ContextCorrelationAgent();
