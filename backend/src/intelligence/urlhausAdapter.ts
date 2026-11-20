import { ThreatIntelResult, OFFLINE_MALICIOUS_DOMAINS } from './threatFeeds';
import { logger } from '../utils/logger';

export class UrlhausAdapter {
  async checkDomain(domain: string): Promise<ThreatIntelResult> {
    const timestamp = new Date().toISOString();
    const cleanDomain = domain.toLowerCase();

    // Check offline grounded database
    const isOfflineMatch = OFFLINE_MALICIOUS_DOMAINS.has(cleanDomain);

    if (isOfflineMatch) {
      return {
        providerName: 'URLhaus Abuse Feeds',
        isAvailable: true,
        isThreatFound: true,
        threatType: 'MALWARE_HOSTING / PHISHING',
        threatDetails: `Domain ${cleanDomain} matches known cybercrime distribution hosts recorded in threat feeds`,
        checkedAt: timestamp,
      };
    }

    return {
      providerName: 'URLhaus Abuse Feeds',
      isAvailable: true,
      isThreatFound: false,
      threatDetails: 'No active malicious payload distributions associated with domain in primary feed',
      checkedAt: timestamp,
    };
  }
}

export const urlhaus = new UrlhausAdapter();
