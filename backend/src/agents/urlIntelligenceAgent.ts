import { AgentResult } from './agentTypes';
import { ThreatIndicator, ExtractedEntities } from '../types';
import { parseAndNormalizeUrl } from '../utils/urlHelper';
import { safeBrowsing } from '../intelligence/safeBrowsingAdapter';
import { urlhaus } from '../intelligence/urlhausAdapter';
import { v4 as uuidv4 } from 'uuid';

export class UrlIntelligenceAgent {
  public readonly name = 'URL Intelligence Agent';

  public async analyze(
    investigationId: string,
    evidenceId: string,
    rawUrl: string
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const urlMeta = parseAndNormalizeUrl(rawUrl);

    const indicators: ThreatIndicator[] = [];
    const uncertainties: string[] = [];
    const extractedEntities: ExtractedEntities = {
      urls: [rawUrl],
      phones: [],
      emails: [],
      upiIds: [],
      organizations: [],
      amounts: [],
      dates: [],
      remoteAccessApps: [],
    };

    if (!urlMeta) {
      return {
        agentName: this.name,
        executionTimeMs: Date.now() - startTime,
        confidence: 40,
        extractedEntities,
        indicators: [],
        summary: 'Submitted string could not be parsed into a valid web URL format.',
        uncertainties: ['Malformed or incomplete URL string.'],
      };
    }

    if (urlMeta.targetLookalikeOrg) {
      extractedEntities.organizations.push(urlMeta.targetLookalikeOrg);
    }

    // 1. Structural Flags Checks
    if (urlMeta.isLookalike) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Typosquatting & Lookalike Impersonation',
        category: 'IMPERSONATION',
        severity: 'HIGH',
        confidence: 90,
        explanation: `Domain ${urlMeta.hostname} embeds target brand name (${urlMeta.targetLookalikeOrg}) on an unverified third-party host.`,
        source: 'URL Intelligence Agent (Domain Analyzer)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    if (urlMeta.isPunycode) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Punycode Homograph Obfuscation',
        category: 'IDENTITY_DECEPTION',
        severity: 'HIGH',
        confidence: 88,
        explanation: 'Domain uses international character substitution (xn--) designed to visually disguise legitimate ASCII domain names.',
        source: 'URL Intelligence Agent (Punycode Parser)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    if (urlMeta.isIpAddress) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Direct IP-Address Destination',
        category: 'MALICIOUS_LINK',
        severity: 'HIGH',
        confidence: 85,
        explanation: 'URL navigates directly to a numeric IP address, bypassing standard domain registry trust and reputation verification.',
        source: 'URL Intelligence Agent (IP Parser)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    if (urlMeta.isShortener) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Obfuscated Shortened Link',
        category: 'MALICIOUS_LINK',
        severity: 'MEDIUM',
        confidence: 75,
        explanation: 'Link obfuscated through a URL shortening service, masking the real landing page destination.',
        source: 'URL Intelligence Agent (Shortener Registry)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    if (urlMeta.hasSuspiciousTld) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'High-Abuse Top-Level Domain',
        category: 'MALICIOUS_LINK',
        severity: 'MEDIUM',
        confidence: 70,
        explanation: `Domain utilizes a top-level domain frequently associated with automated disposable phishing kits.`,
        source: 'URL Intelligence Agent (TLD Registry)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    // 2. Threat Intelligence Lookups
    const [sbResult, uhResult] = await Promise.all([
      safeBrowsing.checkUrl(urlMeta.normalizedUrl, urlMeta.domain),
      urlhaus.checkDomain(urlMeta.domain),
    ]);

    if (sbResult.isThreatFound) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Confirmed Phishing / Malware Host',
        category: 'MALICIOUS_LINK',
        severity: 'CRITICAL',
        confidence: 98,
        explanation: `Confirmed active malicious link in ${sbResult.providerName}: ${sbResult.threatDetails}`,
        source: sbResult.providerName,
        verification_status: 'INTELLIGENCE_CONFIRMED',
      });
    }

    if (uhResult.isThreatFound) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'URLhaus Blacklisted Domain',
        category: 'MALICIOUS_LINK',
        severity: 'CRITICAL',
        confidence: 96,
        explanation: uhResult.threatDetails || 'Domain flagged in active cybercrime distribution registries.',
        source: uhResult.providerName,
        verification_status: 'INTELLIGENCE_CONFIRMED',
      });
    }

    uncertainties.push('External DNS age and registrant records require live registrar API for definitive WHOIS confirmation.');

    return {
      agentName: this.name,
      executionTimeMs: Date.now() - startTime,
      confidence: indicators.length > 0 ? 94 : 85,
      extractedEntities,
      indicators,
      summary: indicators.length > 0
        ? `Flagged ${indicators.length} threat indicator(s) for domain ${urlMeta.hostname}.`
        : `Domain ${urlMeta.hostname} exhibits standard structure with no active blacklist flags.`,
      uncertainties,
    };
  }
}

export const urlIntelligenceAgent = new UrlIntelligenceAgent();
