import { ThreatIndicator, ExtractedEntities, InvestigationRelationship } from '../types';

export interface AgentResult {
  agentName: string;
  executionTimeMs: number;
  confidence: number;
  extractedEntities: ExtractedEntities;
  indicators: ThreatIndicator[];
  relationships?: InvestigationRelationship[];
  summary: string;
  uncertainties: string[];
}
