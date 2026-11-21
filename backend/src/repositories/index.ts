
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


import { pool } from '../database/connection';

// In-Memory Database with Seed Data
class DatabaseRepository {

  // --------------------------------------------------
  // USERS
  // --------------------------------------------------


  public async findUserByEmail(
    email: string
  ): Promise<UserProfile | null> {
    const result = await pool.query(
      `SELECT *
     FROM profiles
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
      [email]
    );

    return result.rows[0] || null;
  }

  public async findUserById(
    id: string
  ): Promise<UserProfile | null> {
    const result = await pool.query(
      `SELECT *
     FROM profiles
     WHERE id = $1
     LIMIT 1`,
      [id]
    );

    return result.rows[0] || null;
  }

  public async createUser(
    user: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
  ): Promise<UserProfile> {
    const result = await pool.query(
      `INSERT INTO profiles (
      email,
      password_hash,
      full_name,
      phone_number,
      role
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
      [
        user.email,
        user.password_hash,
        user.full_name,
        user.phone_number || null,
        user.role,
      ]
    );

    return result.rows[0];
  }

  // --------------------------------------------------
  // INVESTIGATIONS
  // --------------------------------------------------

  public async createInvestigation(
    inv: Omit<Investigation, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Investigation> {
    const result = await pool.query(
      `INSERT INTO investigations (
      user_id,
      title,
      status,
      overall_risk_level,
      overall_risk_score,
      confidence_score,
      explanation_markdown,
      recommended_actions,
      missing_information
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
      [
        inv.user_id,
        inv.title,
        inv.status,
        inv.overall_risk_level,
        inv.overall_risk_score,
        inv.confidence_score,
        inv.explanation_markdown,
        JSON.stringify(inv.recommended_actions),
        JSON.stringify(inv.missing_information),
      ]
    );

    return result.rows[0];
  }
  public async getInvestigationById(
    id: string
  ): Promise<Investigation | null> {
    const investigationResult = await pool.query(
      `SELECT *
     FROM investigations
     WHERE id = $1
     LIMIT 1`,
      [id]
    );

    if (investigationResult.rows.length === 0) {
      return null;
    }

    const [
      evidenceResult,
      indicatorResult,
      relationshipResult,
      riskResult,
    ] = await Promise.all([
      pool.query(
        'SELECT * FROM evidence WHERE investigation_id = $1',
        [id]
      ),
      pool.query(
        'SELECT * FROM threat_indicators WHERE investigation_id = $1',
        [id]
      ),
      pool.query(
        'SELECT * FROM investigation_relationships WHERE investigation_id = $1',
        [id]
      ),
      pool.query(
        `SELECT * FROM risk_assessments
       WHERE investigation_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
        [id]
      ),
    ]);

    return {
      ...investigationResult.rows[0],
      evidence: evidenceResult.rows,
      indicators: indicatorResult.rows,
      relationships: relationshipResult.rows,
      riskAssessment: riskResult.rows[0] || undefined,
    };
  }
  public async listInvestigationsByUserId(
    userId: string
  ): Promise<Investigation[]> {
    const result = await pool.query(
      `SELECT *
     FROM investigations
     WHERE user_id = $1
     ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  public async updateInvestigation(
    id: string,
    updates: Partial<Investigation>
  ): Promise<Investigation | null> {
    const allowedFields = [
      'title',
      'status',
      'overall_risk_level',
      'overall_risk_score',
      'confidence_score',
      'explanation_markdown',
      'recommended_actions',
      'missing_information',
    ] as const;

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      const value = updates[field];

      if (value !== undefined) {
        values.push(
          field === 'recommended_actions' ||
            field === 'missing_information'
            ? JSON.stringify(value)
            : value
        );

        fields.push(`${field} = $${values.length}`);
      }
    }

    if (fields.length === 0) {
      const existing = await pool.query(
        'SELECT * FROM investigations WHERE id = $1',
        [id]
      );

      return existing.rows[0] || null;
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE investigations
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }
  public async deleteInvestigation(id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM investigations
     WHERE id = $1
     RETURNING id`,
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  // --------------------------------------------------
  // EVIDENCE
  // --------------------------------------------------

  public async addEvidence(
    ev: Omit<EvidenceItem, 'id' | 'created_at'>
  ): Promise<EvidenceItem> {
    const result = await pool.query(
      `INSERT INTO evidence (
      investigation_id,
      user_id,
      evidence_type,
      raw_content,
      extracted_entities,
      file_path,
      file_hash,
      mime_type,
      reliability_score
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
      [
        ev.investigation_id,
        ev.user_id,
        ev.evidence_type,
        ev.raw_content ?? null,
        JSON.stringify(ev.extracted_entities),
        ev.file_path ?? null,
        ev.file_hash ?? null,
        ev.mime_type ?? null,
        ev.reliability_score,
      ]
    );

    return result.rows[0];
  }

  public async getEvidenceByInvestigation(
    investigationId: string
  ): Promise<EvidenceItem[]> {
    const result = await pool.query(
      `SELECT *
     FROM evidence
     WHERE investigation_id = $1
     ORDER BY created_at ASC`,
      [investigationId]
    );

    return result.rows;
  }
  // --------------------------------------------------
  // THREAT INDICATORS
  // --------------------------------------------------

  public async replaceIndicatorsForInvestigation(
    investigationId: string,
    indicators: ThreatIndicator[]
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Remove old indicators for this investigation.
      await client.query(
        `DELETE FROM threat_indicators
       WHERE investigation_id = $1`,
        [investigationId]
      );

      // Save the latest indicators.
      for (const indicator of indicators) {
        if (indicator.investigation_id !== investigationId) {
          continue;
        }

        await client.query(
          `INSERT INTO threat_indicators (
          id,
          investigation_id,
          evidence_id,
          indicator_type,
          category,
          severity,
          confidence,
          explanation,
          raw_matched_pattern,
          source,
          verification_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            indicator.id,
            indicator.investigation_id,
            indicator.evidence_id ?? null,
            indicator.indicator_type,
            indicator.category,
            indicator.severity,
            Math.round(
  indicator.confidence <= 1
    ? indicator.confidence * 100
    : indicator.confidence
),
            indicator.explanation,
            indicator.raw_matched_pattern ?? null,
            indicator.source,
            indicator.verification_status
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // --------------------------------------------------
  // RELATIONSHIPS
  // --------------------------------------------------

  public async replaceRelationshipsForInvestigation(
    investigationId: string,
    relations: InvestigationRelationship[]
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Remove old relationships.
      await client.query(
        `DELETE FROM investigation_relationships
       WHERE investigation_id = $1`,
        [investigationId]
      );

      // Save the latest relationships.
      for (const relation of relations) {
        if (relation.investigation_id !== investigationId) {
          continue;
        }

        await client.query(
          `INSERT INTO investigation_relationships (
          id,
          investigation_id,
          source_entity_id,
          source_entity_type,
          source_label,
          target_entity_id,
          target_entity_type,
          target_label,
          relationship_type,
          confidence,
          evidence_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            relation.id,
            relation.investigation_id,
            relation.source_entity_id,
            relation.source_entity_type,
            relation.source_label,
            relation.target_entity_id,
            relation.target_entity_type,
            relation.target_label,
            relation.relationship_type,
            relation.confidence,
            relation.evidence_id ?? null
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // --------------------------------------------------
  // RISK ASSESSMENTS
  // --------------------------------------------------

  public async saveRiskAssessment(
    assessment: RiskAssessment
  ): Promise<void> {
    await pool.query(
      `INSERT INTO risk_assessments (
      investigation_id,
      calculation_version,
      risk_score,
      risk_level,
      confidence,
      factors,
      raw_scores
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        assessment.investigation_id,
        assessment.calculation_version,
        assessment.risk_score,
        assessment.risk_level,
        assessment.confidence,
        JSON.stringify(assessment.factors),
        JSON.stringify(assessment.raw_scores)
      ]
    );
  }

  // --------------------------------------------------
  // EMERGENCY CONTACTS
  // --------------------------------------------------

  public async getEmergencyContacts(
    userId: string
  ): Promise<EmergencyContact[]> {
    const result = await pool.query(
      `SELECT *
     FROM emergency_contacts
     WHERE user_id = $1
     ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  public async addEmergencyContact(
    contact: Omit<EmergencyContact, 'id' | 'created_at'>
  ): Promise<EmergencyContact> {
    const result = await pool.query(
      `INSERT INTO emergency_contacts (
      user_id,
      name,
      phone_number,
      relationship,
      is_active,
      consent_given,
      consent_timestamp
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
      [
        contact.user_id,
        contact.name,
        contact.phone_number,
        contact.relationship,
        contact.is_active,
        contact.consent_given,
        contact.consent_timestamp
      ]
    );

    return result.rows[0];
  }

  public async removeEmergencyContact(
    id: string,
    userId: string
  ): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM emergency_contacts
     WHERE id = $1
       AND user_id = $2
     RETURNING id`,
      [id, userId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  // --------------------------------------------------
  // RECOVERY CASES
  // --------------------------------------------------

  public async createRecoveryCase(
    recoveryCase: Omit<RecoveryCase, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RecoveryCase> {
    const result = await pool.query(
      `INSERT INTO recovery_cases (
      user_id,
      investigation_id,
      case_number,
      incident_date,
      amount_lost,
      transaction_reference,
      bank_name,
      status,
      official_complaint_id,
      notes,
      timeline
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *,
      amount_lost::double precision AS amount_lost`,
      [
        recoveryCase.user_id,
        recoveryCase.investigation_id ?? null,
        recoveryCase.case_number,
        recoveryCase.incident_date,
        recoveryCase.amount_lost,
        recoveryCase.transaction_reference ?? null,
        recoveryCase.bank_name ?? null,
        recoveryCase.status,
        recoveryCase.official_complaint_id ?? null,
        recoveryCase.notes ?? null,
        JSON.stringify(recoveryCase.timeline)
      ]
    );

    return result.rows[0];
  }

  public async getRecoveryCasesByUserId(
  userId: string
): Promise<RecoveryCase[]> {
  const result = await pool.query(
    `SELECT *,
            amount_lost::double precision AS amount_lost
     FROM recovery_cases
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

public async getRecoveryCaseById(
  id: string,
  userId: string
): Promise<RecoveryCase | null> {
  const result = await pool.query(
    `SELECT *,
            amount_lost::double precision AS amount_lost
     FROM recovery_cases
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, userId]
  );

  return result.rows[0] || null;
}
public async updateRecoveryCase(
  id: string,
  userId: string,
  updates: Partial<RecoveryCase>
): Promise<RecoveryCase | null> {

  const effectiveUpdates = { ...updates };

// Automatically synchronize the recovery timeline
if (updates.status && !updates.timeline) {
 const currentCase = await pool.query(
  `SELECT timeline
   FROM recovery_cases
   WHERE id = $1 AND user_id = $2`,
  [id, userId]
);

  if (currentCase.rows.length === 0) {
    return null;
  }

  let timeline = currentCase.rows[0].timeline;

  if (typeof timeline === 'string') {
    timeline = JSON.parse(timeline);
  }

  if (!Array.isArray(timeline)) {
    timeline = [];
  }

  // Add Evidence Collection to older recovery cases
  const evidenceExists = timeline.some(
    (item: any) =>
      item.step.includes('Evidence Collection')
  );

  if (!evidenceExists) {
    timeline.push({
      date: new Date().toISOString(),
      step: 'Evidence Collection',
      description:
        'Collect and preserve transaction screenshots, bank statements, SMS alerts, call logs, and other relevant evidence.',
      completed: false,
    });
  }

  // Status-to-timeline mapping using step names
const statusToStep: Record<string, string> = {
  EVIDENCE_COLLECTED: 'Evidence Collection',
  BANK_CONTACTED: 'Bank Fraud Escalation',
  REPORTED: 'Official National Cybercrime Portal FIR',
};

  const targetStep = statusToStep[updates.status];

  if (targetStep) {
    timeline = timeline.map((item: any) =>
      item.step.includes(targetStep)
        ? {
            ...item,
            completed: true,
            date: new Date().toISOString(),
          }
        : item
    );
  }

  // Canonical timeline order
  const stepOrder = [
    'Incident Documented',
    'Evidence Collection',
    'Immediate Account & Device Quarantine',
    'National Cybercrime Helpline (1930) Call',
    'Bank Fraud Escalation',
    'Official National Cybercrime Portal FIR',
    'Nodal Officer Follow-Up',
  ];

  timeline.sort((a: any, b: any) => {
    const indexA = stepOrder.findIndex(
      step => a.step.includes(step)
    );

    const indexB = stepOrder.findIndex(
      step => b.step.includes(step)
    );

    return (
      (indexA === -1 ? 999 : indexA) -
      (indexB === -1 ? 999 : indexB)
    );
  });

  // Normalize numbering
  timeline = timeline.map((item: any, index: number) => {
    const cleanStep = item.step.replace(/^\d+\.\s*/, '');

    return {
      ...item,
      step: `${index + 1}. ${cleanStep}`,
    };
  });

  effectiveUpdates.timeline = timeline;
}

  const columnMap: Record<string, string> = {
    investigation_id: 'investigation_id',
    case_number: 'case_number',
    incident_date: 'incident_date',
    amount_lost: 'amount_lost',
    transaction_reference: 'transaction_reference',
    bank_name: 'bank_name',
    status: 'status',
    official_complaint_id: 'official_complaint_id',
    notes: 'notes',
    timeline: 'timeline'
  };

  const values: unknown[] = [];
  const setClauses: string[] = [];

  for (const [key, value] of Object.entries(effectiveUpdates)) {
    const column = columnMap[key];

    if (!column) {
      continue;
    }

    values.push(
      key === 'timeline' ? JSON.stringify(value) : value
    );

    setClauses.push(`${column} = $${values.length}`);
  }

  setClauses.push('updated_at = NOW()');
  values.push(id);
  const idParameter = values.length;

  values.push(userId);
  const userIdParameter = values.length;

  const result = await pool.query(
    `UPDATE recovery_cases
     SET ${setClauses.join(', ')}
     WHERE id = $${idParameter}
       AND user_id = $${userIdParameter}
     RETURNING *,
       amount_lost::double precision AS amount_lost`,
    values
  );

  return result.rows[0] || null;
}
  // --------------------------------------------------
  // SCAM PATTERNS & REPORTS
  // --------------------------------------------------

  public async listPatternClusters(): Promise<ScamPatternCluster[]> {
  const result = await pool.query(
    `SELECT *
     FROM scam_pattern_clusters
     ORDER BY report_count DESC, created_at DESC`
  );

  return result.rows;
}

public async createScamReport(
  report: Omit<ScamReport, 'id' | 'created_at'>
): Promise<ScamReport> {
  const result = await pool.query(
    `INSERT INTO scam_reports (
      user_id,
      cluster_id,
      anonymized_text,
      normalized_text,
      extracted_indicators,
      consent_given,
      verification_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      report.user_id ?? null,
      report.cluster_id ?? null,
      report.anonymized_text,
      report.normalized_text,
      JSON.stringify(report.extracted_indicators),
      report.consent_given,
      report.verification_status
    ]
  );

  return result.rows[0];
}
}

export const db = new DatabaseRepository();
