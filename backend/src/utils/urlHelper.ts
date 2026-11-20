export interface UrlAnalysisResult {
  rawUrl: string;
  normalizedUrl: string;
  domain: string;
  hostname: string;
  isIpAddress: boolean;
  isPunycode: boolean;
  isShortener: boolean;
  hasSuspiciousTld: boolean;
  isLookalike: boolean;
  targetLookalikeOrg?: string;
  suspiciousSubdomains: string[];
  flags: string[];
}

const KNOWN_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'is.gd',
  'buff.ly',
  'ow.ly',
  'rebrand.ly',
  'cutt.ly',
  'shorturl.at',
]);

const SUSPICIOUS_TLDS = new Set([
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'top',
  'work',
  'xyz',
  'fit',
  'click',
  'buzz',
  'rest',
]);

const BRAND_TARGETS: Record<string, string[]> = {
  'State Bank of India (SBI)': ['sbi', 'onlinesbi', 'sbicard'],
  'HDFC Bank': ['hdfc', 'hdfcbank', 'netbanking.hdfcbank'],
  'ICICI Bank': ['icicibank', 'icici'],
  'Paytm': ['paytm', 'paytmbank'],
  'India Post': ['indiapost', 'ippbonline'],
  'Income Tax Department': ['incometax', 'incometaxgov', 'efiling'],
  'CBI / Cyber Police': ['cybercrime', 'cbi', 'mumbaipolice', 'delhipolice'],
  'Electricity Department': ['bijli', 'electricitybill', 'powerbill'],
};

export function parseAndNormalizeUrl(rawInput: string): UrlAnalysisResult | null {
  try {
    let input = rawInput.trim();
    if (!/^https?:\/\//i.test(input)) {
      input = 'http://' + input;
    }

    const parsed = new URL(input);
    const hostname = parsed.hostname.toLowerCase();
    const flags: string[] = [];

    // 1. IP Address check
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const isIpAddress = ipv4Regex.test(hostname) || hostname.startsWith('[') || hostname.includes(':');
    if (isIpAddress) {
      flags.push('URL points directly to an IP address rather than a registered domain');
    }

    // 2. Punycode check (xn--)
    const isPunycode = hostname.includes('xn--');
    if (isPunycode) {
      flags.push('Domain utilizes Punycode / Internationalized Domain Name (IDN) encoding, commonly used in lookalike spoofing');
    }

    // 3. Shortener check
    const isShortener = KNOWN_SHORTENERS.has(hostname);
    if (isShortener) {
      flags.push('URL utilizes a URL shortening service that obfuscates the destination');
    }

    // 4. Suspicious TLD check
    const domainParts = hostname.split('.');
    const tld = domainParts[domainParts.length - 1];
    const hasSuspiciousTld = SUSPICIOUS_TLDS.has(tld);
    if (hasSuspiciousTld) {
      flags.push(`Domain uses high-abuse top-level domain (.${tld})`);
    }

    // 5. Lookalike / Brand Impersonation check
    let isLookalike = false;
    let targetLookalikeOrg: string | undefined = undefined;

    for (const [org, brandKeywords] of Object.entries(BRAND_TARGETS)) {
      for (const kw of brandKeywords) {
        if (hostname.includes(kw)) {
          // If the hostname contains the brand keyword, but does not end with the official domain
          const isOfficial =
            (kw === 'sbi' && hostname.endsWith('.sbi') || hostname.endsWith('.onlinesbi.sbi') || hostname.endsWith('.sbi.co.in')) ||
            (kw === 'hdfc' && (hostname.endsWith('.hdfcbank.com') || hostname.endsWith('.hdfc.com'))) ||
            (kw === 'icici' && hostname.endsWith('.icicibank.com')) ||
            (kw === 'paytm' && hostname.endsWith('.paytm.com')) ||
            (kw === 'indiapost' && hostname.endsWith('.indiapost.gov.in')) ||
            (kw === 'cybercrime' && hostname.endsWith('.cybercrime.gov.in'));

          if (!isOfficial) {
            isLookalike = true;
            targetLookalikeOrg = org;
            flags.push(`Domain contains brand keyword "${kw}" but does not belong to verified ${org} infrastructure`);
            break;
          }
        }
      }
      if (isLookalike) break;
    }

    // 6. Suspicious subdomain check
    const suspiciousSubdomains: string[] = [];
    if (domainParts.length > 3) {
      flags.push('Unusually deep subdomain hierarchy (> 3 levels), often employed to mimic legitimate portals');
      suspiciousSubdomains.push(...domainParts.slice(0, domainParts.length - 2));
    }

    return {
      rawUrl: rawInput,
      normalizedUrl: parsed.toString(),
      domain: domainParts.slice(-2).join('.'),
      hostname,
      isIpAddress,
      isPunycode,
      isShortener,
      hasSuspiciousTld,
      isLookalike,
      targetLookalikeOrg,
      suspiciousSubdomains,
      flags,
    };
  } catch (err) {
    return null;
  }
}
