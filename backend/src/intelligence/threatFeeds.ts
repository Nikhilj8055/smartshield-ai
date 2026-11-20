export interface ThreatIntelResult {
  providerName: string;
  isAvailable: boolean;
  isThreatFound: boolean;
  threatType?: string;
  threatDetails?: string;
  checkedAt: string;
  error?: string;
}

// Known malicious phishing domains commonly observed targeting Indian consumers
export const OFFLINE_MALICIOUS_DOMAINS = new Set([
  'sbi-kyc-update.com',
  'hdfc-rewards-portal.top',
  'paytm-kyc-verify.xyz',
  'indiapost-tracking-fee.click',
  'electricity-bill-disconnection.site',
  'cbi-customs-clearance.net',
  'parttime-job-tele.club',
  'quick-loan-apk-download.buzz',
  'pmkisan-gov-scheme.online',
  'airtel-5g-sim-swap.tk',
]);

// Known coercive scam patterns in Indian context
export const COERCIVE_PATTERNS = [
  {
    regex: /(digital\s+arrest|cbi\s+officer|mumbai\s+police|narcotics\s+parcel|fedex\s+contraband)/i,
    category: 'COERCION' as const,
    severity: 'CRITICAL' as const,
    label: 'Digital Arrest / Fake Law Enforcement Coercion',
    explanation: 'Scammers claim you or your passport is linked to an illegal parcel, demanding immediate video interrogation or funds transfer to avoid imminent arrest.',
  },
  {
    regex: /(electricity|power)\s+will\s+be\s+(disconnected|cut\s+off)\s+(tonight|at\s+\d+:\d+)/i,
    category: 'URGENCY' as const,
    severity: 'HIGH' as const,
    label: 'Urgent Electricity Disconnection Threat',
    explanation: 'Fake bill disconnection alert prompting you to call a fraudulent mobile number or install a remote access APK.',
  },
  {
    regex: /(account|sim|card)\s+will\s+be\s+(blocked|suspended|deactivated|closed)\s+(immediately|within\s+\d+\s+hours?)/i,
    category: 'URGENCY' as const,
    severity: 'HIGH' as const,
    label: 'Account Suspension Urgency',
    explanation: 'Fabricated urgency demanding immediate action to unblock your bank or telecom services.',
  },
  {
    regex: /(pan\s+card|aadhaar|kyc)\s+(expired|pending|required|suspended|update\s+now)/i,
    category: 'IMPERSONATION' as const,
    severity: 'HIGH' as const,
    label: 'Fake Bank KYC / PAN Suspension Scheme',
    explanation: 'Phishing attack masquerading as bank compliance to harvest netbanking passwords or Aadhaar details.',
  },
  {
    regex: /(download|install)\s+(anydesk|teamviewer|rustdesk|quicksupport)/i,
    category: 'REMOTE_ACCESS' as const,
    severity: 'CRITICAL' as const,
    label: 'Remote-Access Software Request',
    explanation: 'Instructions to install screen-sharing software allowing scammers complete control over your phone and banking OTPs.',
  },
  {
    regex: /(part[\s-]time\s+job|like\s+youtube\s+videos|earn\s+rs?\.?\s*\d{3,5}\s+daily|telegram\s+task)/i,
    category: 'FINANCIAL' as const,
    severity: 'HIGH' as const,
    label: 'Part-Time Task & YouTube Like Scam',
    explanation: 'Lures victims with micro-rewards for simple tasks before freezing funds in high-deposit investment traps.',
  },
  {
    regex: /(scan\s+qr\s+code\s+to\s+receive|enter\s+(upi\s+)?pin\s+to\s+credit|send\s+rs?\.?\s*1\s+to\s+verify)/i,
    category: 'FINANCIAL' as const,
    severity: 'CRITICAL' as const,
    label: 'UPI Pay-To-Receive Scam',
    explanation: 'Scanning a QR code or entering a UPI PIN ALWAYS transfers money OUT of your account; you NEVER enter a PIN to receive funds.',
  },
  {
    regex: /(do\s+not\s+(tell|inform)\s+anyone|keep\s+this\s+strictly\s+confidential|stay\s+on\s+call\s+alone)/i,
    category: 'COERCION' as const,
    severity: 'CRITICAL' as const,
    label: 'Psychological Isolation & Secrecy Demand',
    explanation: 'Perpetrators enforce isolation from family or advisors so the victim cannot seek objective guidance or verification.',
  },
];
