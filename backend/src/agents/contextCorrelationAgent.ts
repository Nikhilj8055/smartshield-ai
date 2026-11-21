
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

    // Normalize entities to avoid duplicate values.
    const normalize = (values: string[] = []) =>
      Array.from(
        new Set(
          values
            .map((value) => value.trim())
            .filter(Boolean)
        )
      );

    const uniqueOrgs = normalize(accumulatedEntities.organizations);
    const uniqueUrls = normalize(accumulatedEntities.urls);
    const uniquePhones = normalize(accumulatedEntities.phones);
    const uniqueUpis = normalize(accumulatedEntities.upiIds);
    const uniqueRemoteApps = normalize(
      accumulatedEntities.remoteAccessApps
    );

    // Track relationships to prevent duplicates.
    const relationshipKeys = new Set<string>();

    const addRelationship = (
      relationship: InvestigationRelationship
    ) => {
      const key = [
        relationship.source_entity_id,
        relationship.target_entity_id,
        relationship.relationship_type,
        relationship.evidence_id,
      ].join('|');

      if (!relationshipKeys.has(key)) {
        relationshipKeys.add(key);
        relationships.push(relationship);
      }
    };

    // Connect each evidence item to its extracted entities.
    for (const ev of evidenceList) {
      const evId = ev.id;
      const evLabel = `Evidence (${ev.evidence_type})`;

      const entities = ev.extracted_entities;

      if (!entities) {
        uncertainties.push(
          `Evidence ${evId} has no extracted entity information.`
        );
        continue;
      }

      // URL relationships.
      for (const url of normalize(entities.urls)) {
        addRelationship({
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

      // Phone relationships.
      for (const phone of normalize(entities.phones)) {
        addRelationship({
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

      // UPI relationships.
      for (const upi of normalize(entities.upiIds)) {
        addRelationship({
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

      // Organization relationships.
      for (const org of normalize(entities.organizations)) {
        addRelationship({
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

    // Identify whether any evidence claims organizational representation
    // while another piece of evidence requests payment.
    const hasOrganizationClaim = uniqueOrgs.length > 0;
    const hasPaymentDestination = uniqueUpis.length > 0;

    const hasRelatedFinancialIndicator = indicators.some(
      (indicator) =>
        indicator.category === 'FINANCIAL' ||
        indicator.category === 'IDENTITY_DECEPTION'
    );

    if (
      hasOrganizationClaim &&
      hasPaymentDestination &&
      hasRelatedFinancialIndicator
    ) {
      correlationIndicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        indicator_type: 'Organization Claim and Payment Destination Correlation',
        category: 'IDENTITY_DECEPTION',
        severity: 'HIGH',
        confidence: 75,
        explanation:
          `The collected evidence contains a claim of representing ${uniqueOrgs.join(', ')} ` +
          `and a payment destination (${uniqueUpis.join(', ')}). ` +
          'This combination deserves verification. The UPI account ownership and official relationship have not been independently established.',
        source: 'Context Correlation Agent',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    // Remote access and organization claim correlation.
    if (hasOrganizationClaim && uniqueRemoteApps.length > 0) {
      correlationIndicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        indicator_type: 'Organization Claim With Remote Access Request',
        category: 'REMOTE_ACCESS',
        severity: 'CRITICAL',
        confidence: 85,
        explanation:
          `The evidence contains an organization claim involving ${uniqueOrgs.join(', ')} ` +
          `and mentions remote access software (${uniqueRemoteApps.join(', ')}). ` +
          'This combination is a serious warning sign when an unsolicited sender asks the user to install or operate remote access software.',
        source: 'Context Correlation Agent',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    // Check whether URL intelligence has identified suspicious links.
    const suspiciousUrlIndicators = indicators.filter(
      (indicator) =>
        indicator.category === 'MALICIOUS_LINK'
    );

    if (uniqueOrgs.length > 0 && suspiciousUrlIndicators.length > 0) {
      correlationIndicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        indicator_type: 'Organization Claim With Suspicious URL',
        category: 'IDENTITY_DECEPTION',
        severity: 'HIGH',
        confidence: 80,
        explanation:
          `The evidence contains a claim of representing ${uniqueOrgs.join(', ')} ` +
          `and ${suspiciousUrlIndicators.length} suspicious URL-related finding(s). ` +
          'The relationship between the claimed organization and the linked domain should be independently verified.',
        source: 'Context Correlation Agent',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    // Record limitations of the available evidence.
    if (evidenceList.length < 2) {
      uncertainties.push(
        'Only one evidence item is available. Cross-channel correlation is limited without additional messages, URLs, payment details, or sender information.'
      );
    }

    if (uniqueUrls.length === 0) {
      uncertainties.push(
        'No URLs were extracted. Domain reputation and organization-domain relationships could not be evaluated.'
      );
    }

    if (uniqueUpis.length === 0) {
      uncertainties.push(
        'No UPI IDs were extracted. Payment destination correlation could not be performed.'
      );
    }

    if (uniqueOrgs.length === 0) {
      uncertainties.push(
        'No organization claims were extracted. Organization impersonation correlation could not be performed.'
      );
    }

    return {
      agentName: this.name,
      executionTimeMs: Date.now() - startTime,
      confidence: evidenceList.length >= 2 ? 80 : 60,
      extractedEntities: accumulatedEntities,
      indicators: correlationIndicators,
      relationships,
      summary:
        `Built an evidence relationship graph with ${relationships.length} ` +
        `relationship(s) across ${evidenceList.length} evidence item(s). ` +
        `Generated ${correlationIndicators.length} cross-entity finding(s).`,
      uncertainties,
    };
  }
}

export const contextCorrelationAgent = new ContextCorrelationAgent();
