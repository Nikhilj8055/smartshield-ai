
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
  hasCredentialHarvestingPattern: boolean;
  credentialPatternMatches: string[];
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
  'tk', 'ml', 'ga', 'cf', 'gq',
  'top', 'work', 'xyz', 'fit',
  'click', 'buzz', 'rest',
]);

const BRAND_TARGETS: Record<string, string[]> = {
  'State Bank of India (SBI)': [
    'sbi', 'onlinesbi', 'sbicard',
  ],
  'HDFC Bank': [
    'hdfc', 'hdfcbank',
  ],
  'ICICI Bank': [
    'icicibank', 'icici',
  ],
  'Paytm': [
    'paytm', 'paytmbank',
  ],
  'India Post': [
    'indiapost', 'ippbonline',
  ],
  'Income Tax Department': [
    'incometax', 'incometaxgov', 'efiling',
  ],
  'CBI / Cyber Police': [
    'cybercrime', 'cbi', 'mumbaipolice',
    'delhipolice',
  ],
  'Electricity Department': [
    'bijli', 'electricitybill', 'powerbill',
  ],
};

// Terms associated with financial services.
const FINANCIAL_KEYWORDS = [
  'bank',
  'banking',
  'sbi',
  'hdfc',
  'icici',
  'paytm',
  'upi',
  'payment',
  'wallet',
  'kyc',
  'account',
];

// Terms associated with credential collection or urgent verification.
const ACTION_KEYWORDS = [
  'login',
  'signin',
  'verify',
  'verification',
  'update',
  'secure',
  'validate',
  'confirm',
  'authenticate',
  'unlock',
];

function isIpAddress(hostname: string): boolean {
  const ipv4Pattern =
    /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

  if (ipv4Pattern.test(hostname)) return true;

  return hostname.startsWith('[') && hostname.endsWith(']');
}

export function parseAndNormalizeUrl(
  rawInput: string
): UrlAnalysisResult | null {
  try {
    let input = rawInput.trim();

    if (!/^https?:\/\//i.test(input)) {
      input = `http://${input}`;
    }

    const parsed = new URL(input);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    const hostname = parsed.hostname.toLowerCase();
    const flags: string[] = [];
    const hostnameParts = hostname.split('.');
    const tld = hostnameParts[hostnameParts.length - 1];

    // 1. IP address detection
    const ipAddress = isIpAddress(hostname);

    if (ipAddress) {
      flags.push(
        'URL points directly to an IP address instead of a conventional domain.'
      );
    }

    // 2. Punycode detection
    const isPunycode = hostname.includes('xn--');

    if (isPunycode) {
      flags.push(
        'Domain uses Punycode encoding, which can be abused for visually deceptive domains.'
      );
    }

    // 3. URL shortener detection
    const isShortener = KNOWN_SHORTENERS.has(hostname);

    if (isShortener) {
      flags.push(
        'URL uses a recognized shortening service. Its destination needs inspection.'
      );
    }

    // 4. Suspicious TLD detection
    const hasSuspiciousTld = SUSPICIOUS_TLDS.has(tld);

    if (hasSuspiciousTld) {
      flags.push(
        `Domain uses a TLD listed in the project's heuristic registry: .${tld}.`
      );
    }

    // 5. Brand impersonation detection
    let isLookalike = false;
    let targetLookalikeOrg: string | undefined;

    const officialDomains: Record<string, string[]> = {
      'State Bank of India (SBI)': [
        'sbi.co.in',
        'onlinesbi.sbi',
      ],
      'HDFC Bank': [
        'hdfcbank.com',
        'hdfc.com',
      ],
      'ICICI Bank': [
        'icicibank.com',
      ],
      'Paytm': [
        'paytm.com',
      ],
      'India Post': [
        'indiapost.gov.in',
      ],
      'Income Tax Department': [
        'incometax.gov.in',
      ],
      'CBI / Cyber Police': [
        'cybercrime.gov.in',
      ],
    };

    for (const [organization, keywords] of Object.entries(BRAND_TARGETS)) {
      const matchedKeyword = keywords.find((keyword) =>
        hostnameParts.some((part) => part.includes(keyword))
      );

      if (!matchedKeyword) continue;

      const official = (officialDomains[organization] || []).some(
        (domain) =>
          hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (!official) {
        isLookalike = true;
        targetLookalikeOrg = organization;

        flags.push(
          `Hostname contains the brand keyword "${matchedKeyword}" but does not match the configured official-domain list for ${organization}.`
        );

        break;
      }
    }

    // 6. Deep subdomain detection
    const suspiciousSubdomains: string[] = [];

    if (hostnameParts.length > 3) {
      suspiciousSubdomains.push(
        ...hostnameParts.slice(0, -2)
      );

      flags.push(
        'Hostname contains an unusually deep subdomain structure.'
      );
    }

    // 7. Credential-harvesting pattern detection
    const fullUrlText =
      `${hostname} ${parsed.pathname} ${parsed.search}`.toLowerCase();

    const matchedFinancialKeywords = FINANCIAL_KEYWORDS.filter(
      (keyword) => {
        const pattern = new RegExp(
          `(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`,
          'i'
        );

        return pattern.test(fullUrlText);
      }
    );

    const matchedActionKeywords = ACTION_KEYWORDS.filter(
      (keyword) => {
        const pattern = new RegExp(
          `(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`,
          'i'
        );

        return pattern.test(fullUrlText);
      }
    );

    const hasCredentialHarvestingPattern =
      matchedFinancialKeywords.length > 0 &&
      matchedActionKeywords.length > 0;

    const credentialPatternMatches = [
      ...matchedFinancialKeywords,
      ...matchedActionKeywords,
    ];

    if (hasCredentialHarvestingPattern) {
      flags.push(
        'URL combines financial-service terminology with account access or verification terminology. This pattern requires further investigation.'
      );
    }

    // 8. Return analysis
    return {
      rawUrl,
      normalizedUrl: parsed.toString(),
      domain: hostnameParts.slice(-2).join('.'),
      hostname,
      isIpAddress: ipAddress,
      isPunycode,
      isShortener,
      hasSuspiciousTld,
      isLookalike,
      targetLookalikeOrg,
      suspiciousSubdomains,
      hasCredentialHarvestingPattern,
      credentialPatternMatches,
      flags,
    };
  } catch {
    return null;
  }
}
