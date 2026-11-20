import { ThreatIntelResult, OFFLINE_MALICIOUS_DOMAINS } from './threatFeeds';
import { config } from '../config';
import { logger } from '../utils/logger';

export class SafeBrowsingAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = config.threatIntel.googleSafeBrowsingApiKey;
  }

  async checkUrl(url: string, domain: string): Promise<ThreatIntelResult> {
    const timestamp = new Date().toISOString();

    // 1. If API key is present, attempt live Google Safe Browsing lookup
    if (this.apiKey) {
      try {
        const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.apiKey}`;
        const body = {
          client: { clientId: 'smartshield-ai', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error(`Google Safe Browsing returned status ${res.status}`);
        }

        const data: any = await res.json();
        const matches = data.matches || [];
        const isThreatFound = matches.length > 0;

        return {
          providerName: 'Google Safe Browsing',
          isAvailable: true,
          isThreatFound,
          threatType: isThreatFound ? matches[0].threatType : undefined,
          threatDetails: isThreatFound ? `Flagged as ${matches[0].threatType} on target platform` : 'No known threats recorded',
          checkedAt: timestamp,
        };
      } catch (err: any) {
        logger.warn('Google Safe Browsing query failed, relying on offline registry', { error: err.message });
      }
    }

    // 2. Offline / Grounded Threat Signature Matcher
    const isOfflineMatch = OFFLINE_MALICIOUS_DOMAINS.has(domain.toLowerCase());

    return {
      providerName: 'Google Safe Browsing (Offline Threat Model)',
      isAvailable: true,
      isThreatFound: isOfflineMatch,
      threatType: isOfflineMatch ? 'SOCIAL_ENGINEERING' : undefined,
      threatDetails: isOfflineMatch
        ? `Domain ${domain} is cataloged in the SmartShield Phishing & Malicious Host Intelligence Cache`
        : 'Domain not present in high-priority abuse catalogs',
      checkedAt: timestamp,
    };
  }
}

export const safeBrowsing = new SafeBrowsingAdapter();
