import { db } from '../repositories';
import { anonymizeText } from '../utils/hash';
import { ScamPatternCluster, ScamReport } from '../types';

export class ScamPatternService {
  public async getVerifiedClusters(): Promise<ScamPatternCluster[]> {
    const all = await db.listPatternClusters();
    return all.filter((c) => c.status === 'VERIFIED_PATTERN');
  }

  public async getAllClusters(): Promise<ScamPatternCluster[]> {
    return db.listPatternClusters();
  }

  public async reportScam(
    userId: string | undefined,
    rawText: string,
    consentGiven: boolean
  ): Promise<ScamReport> {
    if (!consentGiven) {
      throw new Error('User consent is required to submit report for pattern intelligence.');
    }

    const anonymized = anonymizeText(rawText);
    const normalized = anonymized.toLowerCase().replace(/[^\w\s]/g, ' ').trim();

    // Check if report matches an existing cluster
    const clusters = await db.listPatternClusters();
    let matchedClusterId: string | undefined = undefined;

    for (const cluster of clusters) {
      const isMatch = cluster.sample_indicators.some((ind) =>
        normalized.includes(ind.toLowerCase())
      );
      if (isMatch) {
        matchedClusterId = cluster.id;
        cluster.report_count += 1;
        cluster.updated_at = new Date().toISOString();
        break;
      }
    }

    return db.createScamReport({
      user_id: userId,
      cluster_id: matchedClusterId,
      anonymized_text: anonymized,
      normalized_text: normalized,
      extracted_indicators: [],
      consent_given: true,
      verification_status: matchedClusterId ? 'UNDER_REVIEW' : 'NEW',
    });
  }
}

export const scamPatternService = new ScamPatternService();
