import {
  ThreatIndicator,
  RiskAssessment,
  RiskLevel,
  RiskFactor,
  EvidenceItem,
  IndicatorCategory,
} from '../types';

export const SCORING_VERSION = '1.2.0';

// Configurable Base Severity Weights
const SEVERITY_WEIGHTS: Record<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', number> = {
  LOW: 10,
  MEDIUM: 25,
  HIGH: 45,
  CRITICAL: 75,
};

// Dampeners across repetitive signals within the same category to prevent artificial inflation
const CATEGORY_MAX_SCORES: Record<IndicatorCategory, number> = {
  COERCION: 80,
  REMOTE_ACCESS: 85,
  FINANCIAL: 70,
  IMPERSONATION: 65,
  MALICIOUS_LINK: 75,
  CREDENTIAL_HARVESTING: 70,
  URGENCY: 40, // Urgency alone should never push directly into critical without other vectors
  IDENTITY_DECEPTION: 50,
};

export class DeterministicRiskCalculator {
  /**
   * Computes mathematical risk score and level from structured indicators.
   * Does NOT permit LLM hallucination or arbitrary score invention.
   */
  public calculateRisk(
    investigationId: string,
    indicators: ThreatIndicator[],
    evidence: EvidenceItem[]
  ): RiskAssessment {
    // 1. INSUFFICIENT EVIDENCE check: If no actionable evidence or indicators
    if (!evidence || evidence.length === 0) {
      return {
        investigation_id: investigationId,
        calculation_version: SCORING_VERSION,
        risk_score: 0,
        risk_level: 'INSUFFICIENT EVIDENCE',
        confidence: 0,
        factors: [],
        raw_scores: {},
      };
    }

    // Check if evidence items have no real content or length
    const totalEvidenceCharacters = evidence.reduce((acc, curr) => {
      return acc + (curr.raw_content ? curr.raw_content.trim().length : 0);
    }, 0);

    const hasFileAttachment = evidence.some((e) => !!e.file_path);

    if (totalEvidenceCharacters < 5 && !hasFileAttachment && indicators.length === 0) {
      return {
        investigation_id: investigationId,
        calculation_version: SCORING_VERSION,
        risk_score: 0,
        risk_level: 'INSUFFICIENT EVIDENCE',
        confidence: 10,
        factors: [
          {
            name: 'Insufficient Investigation Input',
            category: 'IDENTITY_DECEPTION',
            severity: 'LOW',
            scoreContribution: 0,
            reason: 'Submitted evidence contains insufficient data to extract risk signals or indicators.',
          },
        ],
        raw_scores: {},
      };
    }

    // 2. Deduplicate indicators to avoid double-counting signals
    const uniqueIndicators = this.deduplicateIndicators(indicators);

    // 3. Category grouping and weighted summation
    const categoryAccumulator: Record<string, number> = {};
    const categoryFactors: RiskFactor[] = [];
    let totalConfidenceNumerator = 0;
    let totalConfidenceDenominator = 0;

    for (const ind of uniqueIndicators) {
      const baseWeight = SEVERITY_WEIGHTS[ind.severity] || 10;
      const confidenceMultiplier = Math.max(0.1, Math.min(1.0, ind.confidence / 100));

      // Source reliability: threat intel feeds get 1.0, automated text rules get 0.9, OCR inferences get 0.85
      let reliability = 0.9;
      if (ind.source.includes('Intelligence') || ind.verification_status === 'INTELLIGENCE_CONFIRMED') {
        reliability = 1.0;
      } else if (ind.source.includes('Screenshot') || ind.source.includes('OCR')) {
        reliability = 0.85;
      }

      const weightedContribution = baseWeight * confidenceMultiplier * reliability;

      const cat = ind.category;
      categoryAccumulator[cat] = (categoryAccumulator[cat] || 0) + weightedContribution;

      categoryFactors.push({
        name: ind.indicator_type,
        category: ind.category,
        severity: ind.severity,
        scoreContribution: Math.round(weightedContribution),
        reason: ind.explanation,
      });

      totalConfidenceNumerator += ind.confidence;
      totalConfidenceDenominator += 1;
    }

    // 4. Apply category caps
    let aggregateScore = 0;
    const rawScoresBreakdown: Record<string, number> = {};

    for (const [cat, rawSum] of Object.entries(categoryAccumulator)) {
      const maxCap = CATEGORY_MAX_SCORES[cat as IndicatorCategory] || 60;
      const cappedSum = Math.min(rawSum, maxCap);
      rawScoresBreakdown[cat] = Math.round(cappedSum);
      aggregateScore += cappedSum;
    }

    // 5. Normalization with diminishing returns
    // Score scaling: aggregate score is bounded between 0 and 100
    // If critical signals exist (e.g. Coercion / Remote access / Confirmed Malicious URL), floor score at 80
    const hasCriticalSeverity = uniqueIndicators.some((i) => i.severity === 'CRITICAL');
    const hasHighSeverity = uniqueIndicators.some((i) => i.severity === 'HIGH');

    let finalScore = Math.min(100, Math.round(aggregateScore));

    if (hasCriticalSeverity) {
      finalScore = Math.max(82, finalScore);
    } else if (hasHighSeverity) {
      finalScore = Math.max(62, finalScore);
    } else if (uniqueIndicators.length === 0) {
      finalScore = 5; // Clean evidence, low baseline
    }

    // 6. Map to RiskLevel
    let riskLevel: RiskLevel = 'LOW';
    if (finalScore >= 80) {
      riskLevel = 'CRITICAL';
    } else if (finalScore >= 60) {
      riskLevel = 'HIGH';
    } else if (finalScore >= 35) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // Calculate overall confidence (default 85 if no indicators but clean text)
    const averageConfidence =
      totalConfidenceDenominator > 0
        ? Math.round(totalConfidenceNumerator / totalConfidenceDenominator)
        : Math.min(95, Math.max(60, evidence.length * 30));

    return {
      investigation_id: investigationId,
      calculation_version: SCORING_VERSION,
      risk_score: finalScore,
      risk_level: riskLevel,
      confidence: averageConfidence,
      factors: categoryFactors.sort((a, b) => b.scoreContribution - a.scoreContribution),
      raw_scores: rawScoresBreakdown,
    };
  }

  /**
   * Removes duplicate or overlapping indicators across sources
   */
  private deduplicateIndicators(indicators: ThreatIndicator[]): ThreatIndicator[] {
    const seen = new Set<string>();
    const deduplicated: ThreatIndicator[] = [];

    for (const ind of indicators) {
      const key = `${ind.category}_${ind.indicator_type.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(ind);
      } else {
        // If seen, upgrade confidence to max of the two
        const existing = deduplicated.find((d) => `${d.category}_${d.indicator_type.toLowerCase()}` === key);
        if (existing && ind.confidence > existing.confidence) {
          existing.confidence = ind.confidence;
        }
      }
    }

    return deduplicated;
  }
}

export const riskCalculator = new DeterministicRiskCalculator();
