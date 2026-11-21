
export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'INSUFFICIENT EVIDENCE';

export type IndicatorCategory =
  | 'COERCION'
  | 'URGENCY'
  | 'FINANCIAL'
  | 'IMPERSONATION'
  | 'MALICIOUS_LINK'
  | 'CREDENTIAL_HARVESTING'
  | 'IDENTITY_DECEPTION'
  | 'REMOTE_ACCESS';

export type EvidenceType =
  | 'MESSAGE'
  | 'URL'
  | 'SCREENSHOT'
  | 'UPI'
  | 'QR'
  | 'SENDER_ID'
  | 'OTHER';

export interface UserProfile {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  phone_number?: string;
  role: 'user' | 'admin' | 'auditor';
  created_at: string;
  updated_at: string;
}

export interface ExtractedEntities {
  urls: string[];
  phones: string[];
  emails: string[];
  upiIds: string[];
  organizations: string[];
  amounts: string[];
  dates: string[];
  remoteAccessApps: string[];
}

export interface ThreatIndicator {
  id: string;
  investigation_id: string;
  evidence_id?: string;
  indicator_type: string;
  category: IndicatorCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  explanation: string;
  raw_matched_pattern?: string;
  source: string;
  verification_status:
    | 'AUTOMATED_MATCH'
    | 'INTELLIGENCE_CONFIRMED'
    | 'USER_REPORTED'
    | 'DISMISSED';
  created_at?: string;
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
  evidence_id?: string;
  created_at?: string;
}

export interface RiskFactor {
  name: string;
  category: IndicatorCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scoreContribution: number;
  reason: string;
}

export interface RiskAssessment {
  id?: string;
  investigation_id: string;
  calculation_version: string;
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  factors: RiskFactor[];
  raw_scores: Record<string, number>;
  created_at?: string;
}

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  user_id: string;
  evidence_type: EvidenceType;
  raw_content?: string;
  extracted_entities: ExtractedEntities;
  file_path?: string;
  file_hash?: string;
  mime_type?: string;
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
  riskAssessment?: RiskAssessment;
}

export interface PaymentInvestigation {
  id: string;
  investigation_id?: string;
  upi_id?: string;
  recipient_name?: string;
  qr_payload?: string;
  amount?: number;
  payment_purpose?: string;
  risk_level: RiskLevel;
  risk_score: number;
  suspicious_patterns: string[];
  findings: ThreatIndicator[];
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship: string;
  is_active: boolean;
  consent_given: boolean;
  consent_timestamp: string;
  created_at: string;
}

export interface RecoveryCase {
  id: string;
  user_id: string;
  investigation_id?: string;
  case_number: string;
  incident_date: string;
  amount_lost: number;
  transaction_reference?: string;
  bank_name?: string;
  status:
    | 'OPEN'
    | 'EVIDENCE_COLLECTED'
    | 'BANK_CONTACTED'
    | 'REPORTED'
    | 'FOLLOW_UP_REQUIRED'
    | 'CLOSED';
  official_complaint_id?: string;
  notes?: string;
  timeline: Array<{
    date: string;
    step: string;
    description: string;
    completed: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ScamPatternCluster {
  id: string;
  cluster_name: string;
  description: string;
  pattern_signature: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  report_count: number;
  status:
    | 'NEW'
    | 'UNDER_REVIEW'
    | 'VERIFIED_PATTERN'
    | 'DISMISSED';
  sample_indicators: string[];
  created_at: string;
  updated_at: string;
}

export interface ScamReport {
  id: string;
  user_id?: string;
  cluster_id?: string;
  anonymized_text: string;
  normalized_text: string;
  extracted_indicators: string[];
  consent_given: boolean;
  verification_status:
    | 'NEW'
    | 'UNDER_REVIEW'
    | 'VERIFIED_PATTERN'
    | 'DISMISSED';
  created_at: string;
}
