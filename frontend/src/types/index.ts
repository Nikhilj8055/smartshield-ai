export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INSUFFICIENT EVIDENCE';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: 'user' | 'admin' | 'auditor';
}

export interface ThreatIndicator {
  id: string;
  investigation_id: string;
  evidence_id?: string;
  indicator_type: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  explanation: string;
  source: string;
  verification_status: string;
}

export interface InvestigationRelationship {
  id: string;
  investigation_id: string;
  source_entity_id: string;
  source_entity_type: string;
  source_label: string;
  target_entity_id: string;
  target_entity_type: string;
  target_label: string;
  relationship_type: string;
  confidence: number;
}

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  evidence_type: 'MESSAGE' | 'URL' | 'SCREENSHOT' | 'UPI' | 'QR' | 'OTHER';
  raw_content?: string;
  extracted_entities: {
    urls: string[];
    phones: string[];
    emails: string[];
    upiIds: string[];
    organizations: string[];
    amounts: string[];
    dates: string[];
    remoteAccessApps: string[];
  };
  file_path?: string;
  reliability_score: number;
  created_at: string;
}

export interface Investigation {
  id: string;
  user_id: string;
  title: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  overall_risk_level: RiskLevel;
  overall_risk_score: number;
  confidence_score: number;
  explanation_markdown: string;
  recommended_actions: string[];
  missing_information: string[];
  created_at: string;
  updated_at: string;
  evidence?: EvidenceItem[];
  indicators?: ThreatIndicator[];
  relationships?: InvestigationRelationship[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone_number: string;
  relationship: string;
  is_active: boolean;
  consent_given: boolean;
  created_at: string;
}

export interface RecoveryCase {
  id: string;
  user_id: string;
  case_number: string;
  incident_date: string;
  amount_lost: number;
  transaction_reference?: string;
  bank_name?: string;
  status: 'OPEN' | 'EVIDENCE_COLLECTED' | 'BANK_CONTACTED' | 'REPORTED' | 'FOLLOW_UP_REQUIRED' | 'CLOSED';
  notes?: string;
  timeline: Array<{
    date: string;
    step: string;
    description: string;
    completed: boolean;
  }>;
  created_at: string;
}

export interface ScamPatternCluster {
  id: string;
  cluster_name: string;
  description: string;
  pattern_signature: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  report_count: number;
  status: string;
  sample_indicators: string[];
}
