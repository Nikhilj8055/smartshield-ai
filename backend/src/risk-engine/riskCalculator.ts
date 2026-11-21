
import {
  ThreatIndicator,
  RiskAssessment,
  RiskLevel,
  RiskFactor,
  EvidenceItem,
  IndicatorCategory,
} from '../types';

export const SCORING_VERSION = '1.4.0';

const SEVERITY_WEIGHTS: Record<
  'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  number
> = {
  LOW: 10,
  MEDIUM: 25,
  HIGH: 45,
  CRITICAL: 75,
};

const CATEGORY_MAX_SCORES: Record<IndicatorCategory, number> = {
  COERCION: 80,
  REMOTE_ACCESS: 85,
  FINANCIAL: 70,
  IMPERSONATION: 65,
  MALICIOUS_LINK: 75,
  CREDENTIAL_HARVESTING: 70,
  URGENCY: 40,
  IDENTITY_DECEPTION: 50,
};

const SEVERITY_RANK: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const VERIFICATION_RANK: Record<string, number> = {
  DISMISSED: 0,
  USER_REPORTED: 1,
  AUTOMATED_MATCH: 2,
  INTELLIGENCE_CONFIRMED: 3,
};

export class DeterministicRiskCalculator {

  /**
   * Supports confidence in either decimal (0-1)
   * or percentage (0-100) format.
   */
  private normalizeConfidence(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    const normalized = value <= 1
      ? value * 100
      : value;

    return Math.max(0, Math.min(100, normalized));
  }

  public calculateRisk(
    investigationId: string,
    indicators: ThreatIndicator[],
    evidence: EvidenceItem[]
  ): RiskAssessment {

    const safeIndicators = indicators || [];
    const safeEvidence = evidence || [];

    // 1. Check available evidence.
    if (safeEvidence.length === 0) {
      return this.createInsufficientAssessment(investigationId, 0);
    }

    const totalEvidenceCharacters = safeEvidence.reduce(
      (total, item) =>
        total + (item.raw_content?.trim().length || 0),
      0
    );

    const hasFileAttachment = safeEvidence.some(
      (item) => Boolean(item.file_path)
    );

    if (
      totalEvidenceCharacters < 5 &&
      !hasFileAttachment &&
      safeIndicators.length === 0
    ) {
      return this.createInsufficientAssessment(investigationId, 10);
    }

    // 2. Remove duplicate indicators.
    const uniqueIndicators = this.deduplicateIndicators(
      safeIndicators
    );

    const categoryAccumulator: Record<string, number> = {};
    const categoryFactors: RiskFactor[] = [];

    let confidenceNumerator = 0;
    let confidenceDenominator = 0;

    // 3. Calculate indicator contributions.
    for (const indicator of uniqueIndicators) {

      const baseWeight =
        SEVERITY_WEIGHTS[indicator.severity] ??
        SEVERITY_WEIGHTS.LOW;

      const normalizedConfidence = this.normalizeConfidence(
        indicator.confidence
      );

      const confidenceMultiplier = normalizedConfidence / 100;

      let reliability = 0.9;

      const source = (indicator.source || '').toLowerCase();

      if (
        source.includes('intelligence') ||
        indicator.verification_status === 'INTELLIGENCE_CONFIRMED'
      ) {
        reliability = 1.0;
      } else if (
        source.includes('screenshot') ||
        source.includes('ocr')
      ) {
        reliability = 0.85;
      }

      const weightedContribution =
        baseWeight *
        confidenceMultiplier *
        reliability;

      const category = indicator.category;

      categoryAccumulator[category] =
        (categoryAccumulator[category] || 0) +
        weightedContribution;

      categoryFactors.push({
        name: indicator.indicator_type,
        category: indicator.category,
        severity: indicator.severity,
        scoreContribution: Math.round(weightedContribution),
        reason: indicator.explanation,
      });

      confidenceNumerator += normalizedConfidence * reliability;
      confidenceDenominator += reliability;
    }

    // 4. Apply category limits.
    let aggregateScore = 0;

    const rawScoresBreakdown: Record<string, number> = {};

    for (const [category, rawScore] of Object.entries(
      categoryAccumulator
    )) {

      const maximumScore =
        CATEGORY_MAX_SCORES[category as IndicatorCategory] ?? 60;

      const cappedScore = Math.min(rawScore, maximumScore);

      rawScoresBreakdown[category] = Math.round(cappedScore);

      aggregateScore += cappedScore;
    }

// 5. Calculate final score.
const calculatedScore = Math.min(
  100,
  Math.max(0, Math.round(aggregateScore))
);

// High-confidence CRITICAL coercion must remain CRITICAL.
const hasHighConfidenceCriticalCoercion = uniqueIndicators.some(
  (indicator) =>
    indicator.category === 'COERCION' &&
    indicator.severity === 'CRITICAL' &&
    this.normalizeConfidence(indicator.confidence) >= 85
);

const finalScore = hasHighConfidenceCriticalCoercion
  ? Math.max(calculatedScore, 80)
  : calculatedScore;

    // 6. Determine risk level.
    let riskLevel: RiskLevel;

    if (finalScore >= 80) {
      riskLevel = 'CRITICAL';
    } else if (finalScore >= 60) {
      riskLevel = 'HIGH';
    } else if (finalScore >= 35) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // 7. Calculate confidence.
    let overallConfidence: number;

    if (confidenceDenominator > 0) {
      overallConfidence = Math.round(
        confidenceNumerator / confidenceDenominator
      );
    } else {
      overallConfidence = Math.min(
        60,
        30 + safeEvidence.length * 10
      );
    }

    overallConfidence = Math.max(
      0,
      Math.min(100, overallConfidence)
    );

    // 8. Return explainable assessment.
    return {
      investigation_id: investigationId,
      calculation_version: SCORING_VERSION,
      risk_score: finalScore,
      risk_level: riskLevel,
      confidence: overallConfidence,

      factors: categoryFactors.sort(
        (a, b) => b.scoreContribution - a.scoreContribution
      ),

      raw_scores: rawScoresBreakdown,
    };
  }

  private createInsufficientAssessment(
    investigationId: string,
    confidence: number
  ): RiskAssessment {
    return {
      investigation_id: investigationId,
      calculation_version: SCORING_VERSION,
      risk_score: 0,
      risk_level: 'INSUFFICIENT EVIDENCE',
      confidence,

      factors: [
        {
          name: 'Insufficient Investigation Input',
          category: 'IDENTITY_DECEPTION',
          severity: 'LOW',
          scoreContribution: 0,
          reason:
            'There is not enough usable evidence to calculate a meaningful risk score.',
        },
      ],

      raw_scores: {},
    };
  }

  private deduplicateIndicators(
    indicators: ThreatIndicator[]
  ): ThreatIndicator[] {

    const indicatorMap = new Map<string, ThreatIndicator>();

    for (const indicator of indicators) {

      const key = [
        indicator.category,
        indicator.indicator_type.trim().toLowerCase(),
      ].join('_');

      const existing = indicatorMap.get(key);

      if (!existing) {
        indicatorMap.set(key, { ...indicator });
        continue;
      }

      const strongerSeverity =
        (SEVERITY_RANK[indicator.severity] || 0) >
        (SEVERITY_RANK[existing.severity] || 0);

      const strongerVerification =
        (VERIFICATION_RANK[indicator.verification_status] || 0) >
        (VERIFICATION_RANK[existing.verification_status] || 0);

      indicatorMap.set(key, {
        ...existing,

        severity: strongerSeverity
          ? indicator.severity
          : existing.severity,

        confidence: Math.max(
          this.normalizeConfidence(existing.confidence),
          this.normalizeConfidence(indicator.confidence)
        ),

        verification_status: strongerVerification
          ? indicator.verification_status
          : existing.verification_status,

        explanation:
          strongerSeverity || strongerVerification
            ? indicator.explanation
            : existing.explanation,
      });
    }

    return Array.from(indicatorMap.values());
  }
}

export const riskCalculator = new DeterministicRiskCalculator();
