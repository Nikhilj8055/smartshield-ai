
import {
  UserProfile,
  Investigation,
  EvidenceItem,
  ThreatIndicator,
  InvestigationRelationship,
  RiskAssessment,
  PaymentInvestigation,
  EmergencyContact,
  RecoveryCase,
  ScamPatternCluster,
  ScamReport,
} from '../types';

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// In-Memory Database with Seed Data
class DatabaseRepository {
  public users: Map<string, UserProfile> = new Map();
  public investigations: Map<string, Investigation> = new Map();
  public evidence: Map<string, EvidenceItem> = new Map();
  public threatIndicators: Map<string, ThreatIndicator> = new Map();
  public relationships: Map<string, InvestigationRelationship> = new Map();
  public riskAssessments: Map<string, RiskAssessment> = new Map();

  public paymentInvestigations: Map<string, PaymentInvestigation> = new Map();
  public emergencyContacts: Map<string, EmergencyContact> = new Map();
  public recoveryCases: Map<string, RecoveryCase> = new Map();
  public scamPatternClusters: Map<string, ScamPatternCluster> = new Map();
  public scamReports: Map<string, ScamReport> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // --------------------------------------------------
  // SEED DATA
  // --------------------------------------------------

  private seedInitialData(): void {
    const demoUserId = '00000000-0000-0000-0000-000000000001';

    const demoPasswordHash = bcrypt.hashSync(
      'SmartShield@2026',
      10
    );

    const demoUser: UserProfile = {
      id: demoUserId,
      email: 'demo@smartshield.ai',
      password_hash: demoPasswordHash,
      full_name: 'Priya Sharma',
      phone_number: '+919876543210',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.set(demoUser.id, demoUser);

    const clusters: ScamPatternCluster[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        cluster_name: 'Digital Arrest & Police Impersonation',
        description:
          'Scammers impersonate CBI, Mumbai Cyber Police, or ED via video calls claiming illegal parcels containing narcotics or money laundering.',
        pattern_signature: 'sig_digital_arrest_cbi_parcel_v1',
        risk_level: 'CRITICAL',
        report_count: 142,
        status: 'VERIFIED_PATTERN',
        sample_indicators: [
          'digital arrest',
          'mumbai cyber crime',
          'customs narcotics',
          'skype interrogation',
          'rbi verification deposit',
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        cluster_name: 'Urgent Electricity Bill Disconnection',
        description:
          'SMS/WhatsApp claiming power disconnection at 9:30 PM due to unpaid bill, with a fake mobile number or malicious APK download link.',
        pattern_signature: 'sig_electricity_bill_disconnection_v1',
        risk_level: 'HIGH',
        report_count: 89,
        status: 'VERIFIED_PATTERN',
        sample_indicators: [
          'power will be disconnected tonight',
          'contact electricity officer',
          'update electricity bill',
          'download support apk',
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        cluster_name: 'Bank Account / PAN KYC Suspension Phishing',
        description:
          'SMS disguised as SBI/HDFC claiming bank account has been blocked due to pending PAN/Aadhaar KYC.',
        pattern_signature: 'sig_bank_pan_kyc_suspension_v1',
        risk_level: 'HIGH',
        report_count: 215,
        status: 'VERIFIED_PATTERN',
        sample_indicators: [
          'your bank account blocked',
          'update pan card immediately',
          'sbi-kyc-update',
          'hdfc-secure-verify',
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        cluster_name: 'Part-Time YouTube/Hotel Review Task Scam',
        description:
          'Telegram/WhatsApp recruitment offering Rs 2000-5000/day for liking YouTube videos, escalating into frozen prepaid crypto traps.',
        pattern_signature: 'sig_part_time_task_investment_v1',
        risk_level: 'CRITICAL',
        report_count: 310,
        status: 'VERIFIED_PATTERN',
        sample_indicators: [
          'part time job earn 3000 daily',
          'like youtube videos',
          'telegram task group',
          'frozen deposit task',
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        cluster_name: 'UPI Pay-To-Receive Money / OLX QR Scam',
        description:
          'Scammer pretends to purchase an item on OLX, sends a QR code claiming scanning or entering UPI PIN will receive money.',
        pattern_signature: 'sig_upi_pay_to_receive_qr_v1',
        risk_level: 'HIGH',
        report_count: 188,
        status: 'VERIFIED_PATTERN',
        sample_indicators: [
          'scan qr to receive money',
          'enter upi pin to accept refund',
          'military buyer olx',
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const cluster of clusters) {
      this.scamPatternClusters.set(cluster.id, cluster);
    }

    const demoContact: EmergencyContact = {
      id: uuidv4(),
      user_id: demoUserId,
      name: 'Ramesh Sharma (Father)',
      phone_number: '+919811223344',
      relationship: 'Father',
      is_active: true,
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    this.emergencyContacts.set(demoContact.id, demoContact);
  }

  // --------------------------------------------------
  // USERS
  // --------------------------------------------------

  public async findUserByEmail(
    email: string
  ): Promise<UserProfile | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }

    return null;
  }

  public async findUserById(
    id: string
  ): Promise<UserProfile | null> {
    return this.users.get(id) || null;
  }

  public async createUser(
    user: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserProfile> {
    const id = uuidv4();

    const newUser: UserProfile = {
      ...user,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.set(id, newUser);

    return newUser;
  }

  // --------------------------------------------------
  // INVESTIGATIONS
  // --------------------------------------------------

  public async createInvestigation(
    inv: Omit<Investigation, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Investigation> {
    const id = uuidv4();

    const created: Investigation = {
      ...inv,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.investigations.set(id, created);

    return created;
  }

  public async getInvestigationById(
    id: string
  ): Promise<Investigation | null> {
    const inv = this.investigations.get(id);

    if (!inv) {
      return null;
    }

    const evidenceList = Array.from(this.evidence.values())
      .filter((e) => e.investigation_id === id);

    const indicatorList = Array.from(this.threatIndicators.values())
      .filter((i) => i.investigation_id === id);

    const relationList = Array.from(this.relationships.values())
      .filter((r) => r.investigation_id === id);

    const risk = this.riskAssessments.get(id);

    return {
      ...inv,
      evidence: evidenceList,
      indicators: indicatorList,
      relationships: relationList,
      riskAssessment: risk,
    };
  }

  public async listInvestigationsByUserId(
    userId: string
  ): Promise<Investigation[]> {
    return Array.from(this.investigations.values())
      .filter((inv) => inv.user_id === userId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
  }

  public async updateInvestigation(
    id: string,
    updates: Partial<Investigation>
  ): Promise<Investigation | null> {
    const existing = this.investigations.get(id);

    if (!existing) {
      return null;
    }

    const updated: Investigation = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.investigations.set(id, updated);

    return updated;
  }

  public async deleteInvestigation(id: string): Promise<boolean> {
    if (!this.investigations.has(id)) {
      return false;
    }

    // Delete associated evidence.
    for (const [evidenceId, evidence] of this.evidence.entries()) {
      if (evidence.investigation_id === id) {
        this.evidence.delete(evidenceId);
      }
    }

    // Delete associated indicators.
    for (const [indicatorId, indicator] of this.threatIndicators.entries()) {
      if (indicator.investigation_id === id) {
        this.threatIndicators.delete(indicatorId);
      }
    }

    // Delete associated relationships.
    for (const [relationshipId, relationship] of this.relationships.entries()) {
      if (relationship.investigation_id === id) {
        this.relationships.delete(relationshipId);
      }
    }

    // Delete associated risk assessment.
    this.riskAssessments.delete(id);

    // Delete investigation.
    return this.investigations.delete(id);
  }

  // --------------------------------------------------
  // EVIDENCE
  // --------------------------------------------------

  public async addEvidence(
    ev: Omit<EvidenceItem, 'id' | 'created_at'>
  ): Promise<EvidenceItem> {
    const id = uuidv4();

    const newEv: EvidenceItem = {
      ...ev,
      id,
      created_at: new Date().toISOString(),
    };

    this.evidence.set(id, newEv);

    return newEv;
  }

  public async getEvidenceByInvestigation(
    investigationId: string
  ): Promise<EvidenceItem[]> {
    return Array.from(this.evidence.values())
      .filter((e) => e.investigation_id === investigationId);
  }

  // --------------------------------------------------
  // THREAT INDICATORS
  // --------------------------------------------------

  public async replaceIndicatorsForInvestigation(
    investigationId: string,
    indicators: ThreatIndicator[]
  ): Promise<void> {
    // Remove old indicators belonging to this investigation.
    for (const [id, indicator] of this.threatIndicators.entries()) {
      if (indicator.investigation_id === investigationId) {
        this.threatIndicators.delete(id);
      }
    }

    // Save the latest indicators.
    for (const indicator of indicators) {
      if (indicator.investigation_id === investigationId) {
        this.threatIndicators.set(indicator.id, indicator);
      }
    }
  }

  // --------------------------------------------------
  // RELATIONSHIPS
  // --------------------------------------------------

  public async replaceRelationshipsForInvestigation(
    investigationId: string,
    relations: InvestigationRelationship[]
  ): Promise<void> {
    // Remove old relationships belonging to this investigation.
    for (const [id, relation] of this.relationships.entries()) {
      if (relation.investigation_id === investigationId) {
        this.relationships.delete(id);
      }
    }

    // Save the latest relationships.
    for (const relation of relations) {
      if (relation.investigation_id === investigationId) {
        this.relationships.set(relation.id, relation);
      }
    }
  }

  // --------------------------------------------------
  // RISK ASSESSMENTS
  // --------------------------------------------------

  public async saveRiskAssessment(
    assessment: RiskAssessment
  ): Promise<void> {
    this.riskAssessments.set(
      assessment.investigation_id,
      assessment
    );
  }

  // --------------------------------------------------
  // EMERGENCY CONTACTS
  // --------------------------------------------------

  public async getEmergencyContacts(
    userId: string
  ): Promise<EmergencyContact[]> {
    return Array.from(this.emergencyContacts.values())
      .filter((contact) => contact.user_id === userId);
  }

  public async addEmergencyContact(
    contact: Omit<EmergencyContact, 'id' | 'created_at'>
  ): Promise<EmergencyContact> {
    const id = uuidv4();

    const newContact: EmergencyContact = {
      ...contact,
      id,
      created_at: new Date().toISOString(),
    };

    this.emergencyContacts.set(id, newContact);

    return newContact;
  }

  public async removeEmergencyContact(
    id: string,
    userId: string
  ): Promise<boolean> {
    const contact = this.emergencyContacts.get(id);

    if (contact && contact.user_id === userId) {
      return this.emergencyContacts.delete(id);
    }

    return false;
  }

  // --------------------------------------------------
  // RECOVERY CASES
  // --------------------------------------------------

  public async createRecoveryCase(
    recoveryCase: Omit<RecoveryCase, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RecoveryCase> {
    const id = uuidv4();

    const newCase: RecoveryCase = {
      ...recoveryCase,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.recoveryCases.set(id, newCase);

    return newCase;
  }

  public async getRecoveryCasesByUserId(
    userId: string
  ): Promise<RecoveryCase[]> {
    return Array.from(this.recoveryCases.values())
      .filter((recoveryCase) => recoveryCase.user_id === userId);
  }

  public async getRecoveryCaseById(
    id: string
  ): Promise<RecoveryCase | null> {
    return this.recoveryCases.get(id) || null;
  }

  public async updateRecoveryCase(
    id: string,
    updates: Partial<RecoveryCase>
  ): Promise<RecoveryCase | null> {
    const existing = this.recoveryCases.get(id);

    if (!existing) {
      return null;
    }

    const updated: RecoveryCase = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.recoveryCases.set(id, updated);

    return updated;
  }

  // --------------------------------------------------
  // SCAM PATTERNS & REPORTS
  // --------------------------------------------------

  public async listPatternClusters(): Promise<ScamPatternCluster[]> {
    return Array.from(this.scamPatternClusters.values());
  }

  public async createScamReport(
    report: Omit<ScamReport, 'id' | 'created_at'>
  ): Promise<ScamReport> {
    const id = uuidv4();

    const newReport: ScamReport = {
      ...report,
      id,
      created_at: new Date().toISOString(),
    };

    this.scamReports.set(id, newReport);

    return newReport;
  }
}

export const db = new DatabaseRepository();
