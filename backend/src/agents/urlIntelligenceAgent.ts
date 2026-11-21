
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
    const cleanUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';

    const extractedEntities: ExtractedEntities = {
      urls: cleanUrl ? [cleanUrl] : [],
      phones: [],
      emails: [],
      upiIds: [],
      organizations: [],
      amounts: [],
      dates: [],
      remoteAccessApps: [],
    };

    const indicators: ThreatIndicator[] = [];
    const uncertainties: string[] = [];

    // 1. INPUT VALIDATION

    if (!cleanUrl) {
      return {
        agentName: this.name,
        executionTimeMs: Date.now() - startTime,
        confidence: 0,
        extractedEntities,
        indicators: [],
        summary: 'No URL was provided for investigation.',
        uncertainties: ['Insufficient evidence: URL input is empty.'],
      };
    }

    const urlMeta = parseAndNormalizeUrl(cleanUrl);

    if (!urlMeta) {
      return {
        agentName: this.name,
        executionTimeMs: Date.now() - startTime,
        confidence: 0,
        extractedEntities,
        indicators: [],
        summary: 'The supplied input could not be parsed as a valid web URL.',
        uncertainties: [
          'URL is malformed or incomplete.',
          'No threat-intelligence lookup was performed.',
        ],
      };
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(urlMeta.normalizedUrl);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Unsupported URL protocol.');
      }
    } catch {
      return {
        agentName: this.name,
        executionTimeMs: Date.now() - startTime,
        confidence: 0,
        extractedEntities,
        indicators: [],
        summary: 'Unsupported or invalid URL protocol.',
        uncertainties: ['Only HTTP and HTTPS URLs are supported.'],
      };
    }

    if (urlMeta.targetLookalikeOrg) {
      extractedEntities.organizations.push(
        urlMeta.targetLookalikeOrg
      );
    }

    // 2. INDICATOR GENERATION

    const detectedRules = new Set<string>();

    const addIndicator = (
      key: string,
      indicatorType: string,
      category: ThreatIndicator['category'],
      severity: ThreatIndicator['severity'],
      confidence: number,
      explanation: string,
      source: string,
      verificationStatus: ThreatIndicator['verification_status'],
      matchedPattern?: string
    ) => {
      if (detectedRules.has(key)) return;

      detectedRules.add(key);

      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: indicatorType,
        category,
        severity,
        confidence,
        explanation,
        raw_matched_pattern: matchedPattern,
        source,
        verification_status: verificationStatus,
      });
    };

    // 3. DOMAIN LOOKALIKE DETECTION

    if (urlMeta.isLookalike) {
      addIndicator(
        'lookalike-domain',
        'Potential Phishing / Typosquatting (Brand Impersonation)',
        'IMPERSONATION',
        'HIGH',
        75,
        `The hostname ${urlMeta.hostname} contains a brand-related keyword associated with ${urlMeta.targetLookalikeOrg}, but does not match the helper's configured official-domain rules. This requires independent verification.`,
        'URL Intelligence Agent - Domain Structure',
        'AUTOMATED_MATCH'
      );
    }

    // 4. PUNYCODE DETECTION

    if (urlMeta.isPunycode) {
      addIndicator(
        'punycode-domain',
        'Internationalized Domain Name',
        'IDENTITY_DECEPTION',
        'MEDIUM',
        65,
        `The hostname ${urlMeta.hostname} uses Punycode encoding. This can be legitimate, but can also be used for visually deceptive domains.`,
        'URL Intelligence Agent - IDN Parser',
        'AUTOMATED_MATCH'
      );
    }

    // 5. DIRECT IP ADDRESS

    if (urlMeta.isIpAddress) {
      addIndicator(
        'ip-address-host',
        'Direct IP Address Destination',
        'MALICIOUS_LINK',
        'MEDIUM',
        60,
        'The URL points directly to an IP address instead of a conventional domain name. This is unusual for many consumer-facing services but is not proof of malicious activity.',
        'URL Intelligence Agent - Hostname Parser',
        'AUTOMATED_MATCH'
      );
    }

    // 6. URL SHORTENER

    if (urlMeta.isShortener) {
      addIndicator(
        'url-shortener',
        'URL Shortening Service Detected',
        'MALICIOUS_LINK',
        'LOW',
        50,
        'The URL uses a recognized shortening service. Its final destination is not established by this check. Resolve it safely before assessing the destination.',
        'URL Intelligence Agent - Shortener Registry',
        'AUTOMATED_MATCH'
      );

      uncertainties.push(
        'The shortened URL destination has not been resolved or inspected.'
      );
    }

    // 7. SUSPICIOUS TOP-LEVEL DOMAIN

    if (urlMeta.hasSuspiciousTld) {
      addIndicator(
        'suspicious-tld',
        'Potentially High-Abuse Top-Level Domain',
        'MALICIOUS_LINK',
        'LOW',
        45,
        "The domain uses a TLD listed in the project's heuristic registry. TLD choice alone cannot establish that a website is malicious.",
        'URL Intelligence Agent - TLD Heuristic',
        'AUTOMATED_MATCH'
      );
    }

    // 8. UNUSUAL SUBDOMAIN STRUCTURE

    if (urlMeta.suspiciousSubdomains.length > 0) {
      addIndicator(
        'deep-subdomain',
        'Unusually Deep Subdomain Structure',
        'IDENTITY_DECEPTION',
        'LOW',
        45,
        `The hostname contains multiple subdomain levels: ${urlMeta.suspiciousSubdomains.join(', ')}. This structure deserves inspection but is not proof of impersonation.`,
        'URL Intelligence Agent - Hostname Structure',
        'AUTOMATED_MATCH'
      );
    }

    // 8.5. CREDENTIAL HARVESTING PATTERN

    if (urlMeta.hasCredentialHarvestingPattern) {
      addIndicator(
        'credential-harvesting-pattern',
        'Suspicious Financial Login or Verification Pattern',
        'IDENTITY_DECEPTION',
        'MEDIUM',
        65,
        `The URL combines financial-service keywords with account access or verification keywords: ${urlMeta.credentialPatternMatches.join(', ')}. This pattern may indicate a credential-harvesting attempt, but does not independently prove malicious activity.`,
        'URL Intelligence Agent - Credential Pattern Analysis',
        'AUTOMATED_MATCH',
        urlMeta.normalizedUrl
      );
    }

    // 9. EXTERNAL THREAT INTELLIGENCE

    let sbAvailable = false;
    let uhAvailable = false;

    try {
      const [sbResult, uhResult] = await Promise.all([
        safeBrowsing.checkUrl(
          urlMeta.normalizedUrl,
          urlMeta.domain
        ),
        urlhaus.checkDomain(urlMeta.domain),
      ]);

      sbAvailable = sbResult.isAvailable;
      uhAvailable = uhResult.isAvailable;

      // Google Safe Browsing

      if (sbResult.isThreatFound) {
        const isOffline =
          sbResult.providerName.toLowerCase().includes('offline');

        addIndicator(
          'safe-browsing-threat',
          'Threat Match in Safe Browsing Lookup',
          'MALICIOUS_LINK',
          'CRITICAL',
          isOffline ? 70 : 95,
          `${sbResult.providerName}: ${sbResult.threatDetails || 'Threat match detected.'}`,
          sbResult.providerName,
          isOffline
            ? 'AUTOMATED_MATCH'
            : 'INTELLIGENCE_CONFIRMED'
        );
      }

      // URLhaus

      if (uhResult.isThreatFound) {
        addIndicator(
          'urlhaus-threat',
          'Match in Local Threat Intelligence Cache',
          'MALICIOUS_LINK',
          'HIGH',
          70,
          `${uhResult.threatDetails || 'Domain matched a locally configured threat entry.'} Live URLhaus verification is not currently implemented.`,
          uhResult.providerName,
          'AUTOMATED_MATCH'
        );
      }

      if (!sbAvailable) {
        uncertainties.push(
          'Google Safe Browsing was unavailable. No conclusion can be drawn from this provider.'
        );
      }

      if (!uhAvailable) {
        uncertainties.push(
          'URLhaus lookup was unavailable. No conclusion can be drawn from this provider.'
        );
      }

      if (!sbResult.isThreatFound && sbAvailable) {
        uncertainties.push(
          'Google Safe Browsing reported no known threat match. This does not prove the URL is safe.'
        );
      }

      if (!uhResult.isThreatFound && uhAvailable) {
        uncertainties.push(
          'The URLhaus adapter reported no match. Its current implementation uses a local cache rather than a live URLhaus query.'
        );
      }
    } catch {
      uncertainties.push(
        'One or more threat-intelligence lookups failed unexpectedly. External verification is incomplete.'
      );
    }

    // 10. GENERAL INVESTIGATION UNCERTAINTIES

    uncertainties.push(
      'Domain registration age and ownership have not been verified.'
    );

    uncertainties.push(
      'The final landing page and redirect chain have not been inspected.'
    );

    uncertainties.push(
      'A valid HTTPS certificate does not establish that a website is trustworthy.'
    );

    if (indicators.length === 0) {
      uncertainties.push(
        'No configured structural or threat-feed indicators were detected. The URL must not be classified as safe based on this result alone.'
      );
    }

    // 11. FINAL RESULT

    const summary =
      indicators.length > 0
        ? `Detected ${indicators.length} URL-related indicator(s) for ${urlMeta.hostname}. Review the evidence and verification status before making a decision.`
        : `No configured URL threat indicators were detected for ${urlMeta.hostname}. The URL remains unverified.`;

    return {
      agentName: this.name,
      executionTimeMs: Date.now() - startTime,
      confidence: indicators.length > 0 ? 65 : 35,
      extractedEntities,
      indicators,
      summary,
      uncertainties,
    };
  }
}

export const urlIntelligenceAgent =
  new UrlIntelligenceAgent();
