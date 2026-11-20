export interface UpiValidationResult {
  rawInput: string;
  isValidSyntax: boolean;
  username: string;
  handle: string;
  isRecognizedPspHandle: boolean;
  pspBank?: string;
  flags: string[];
}

export interface DecodedQrPayload {
  rawPayload: string;
  type: 'UPI_PAYMENT' | 'WEBSITE_URL' | 'TEXT_OR_DATA';
  upiDetails?: {
    payeeVpa?: string;
    payeeName?: string;
    amount?: number;
    transactionNote?: string;
    merchantCode?: string;
    currency?: string;
  };
  destinationUrl?: string;
  flags: string[];
}

// Major NPCI / PSP Bank UPI Handles in India
const KNOWN_UPI_HANDLES: Record<string, string> = {
  okhdfcbank: 'Google Pay (HDFC Bank)',
  okaxis: 'Google Pay (Axis Bank)',
  oksbi: 'Google Pay (State Bank of India)',
  okicici: 'Google Pay (ICICI Bank)',
  ybl: 'PhonePe (Yes Bank)',
  ibl: 'PhonePe (ICICI Bank)',
  axl: 'PhonePe (Axis Bank)',
  paytm: 'Paytm Payments Bank / One97',
  upi: 'BHIM NPCI',
  apl: 'Amazon Pay (Axis Bank)',
  rapl: 'Amazon Pay (RBL Bank)',
  sbi: 'State Bank of India (BHIM SBI Pay)',
  barodampay: 'Bank of Baroda',
  pnb: 'Punjab National Bank',
  kotak: 'Kotak Mahindra Bank',
  indus: 'IndusInd Bank',
  federal: 'Federal Bank',
  idfcbank: 'IDFC FIRST Bank',
};

export function validateUpiSyntax(upiString: string): UpiValidationResult {
  const trimmed = upiString.trim();
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const flags: string[] = [];

  if (!upiRegex.test(trimmed)) {
    return {
      rawInput: trimmed,
      isValidSyntax: false,
      username: '',
      handle: '',
      isRecognizedPspHandle: false,
      flags: ['Invalid UPI Virtual Payment Address (VPA) format.'],
    };
  }

  const [username, handle] = trimmed.split('@');
  const lowerHandle = handle.toLowerCase();
  const pspBank = KNOWN_UPI_HANDLES[lowerHandle];
  const isRecognized = !!pspBank;

  if (!isRecognized) {
    flags.push(`Handle "@${handle}" is not in the common Indian PSP handle registry. Verify recipient carefully.`);
  }

  // Check for suspicious numeric-only or obfuscated usernames
  if (/^\d{10,}$/.test(username) && !/^[6-9]\d{9}$/.test(username)) {
    flags.push('Username contains an unusual long number sequence.');
  }

  return {
    rawInput: trimmed,
    isValidSyntax: true,
    username,
    handle: lowerHandle,
    isRecognizedPspHandle: isRecognized,
    pspBank,
    flags,
  };
}

export function decodeQrPayload(payloadString: string): DecodedQrPayload {
  const trimmed = payloadString.trim();
  const flags: string[] = [];

  // 1. UPI Payment URI (e.g. upi://pay?pa=recipient@bank&pn=Merchant&am=500&cu=INR)
  if (trimmed.toLowerCase().startsWith('upi://pay')) {
    try {
      const url = new URL(trimmed);
      const pa = url.searchParams.get('pa') || undefined;
      const pn = url.searchParams.get('pn') || undefined;
      const am = url.searchParams.get('am') ? parseFloat(url.searchParams.get('am')!) : undefined;
      const tn = url.searchParams.get('tn') || undefined;
      const mc = url.searchParams.get('mc') || undefined;
      const cu = url.searchParams.get('cu') || 'INR';

      if (pa) {
        const upiCheck = validateUpiSyntax(pa);
        if (!upiCheck.isValidSyntax) {
          flags.push('QR encodes a malformed or non-standard UPI address.');
        }
      }

      if (am && am > 50000) {
        flags.push(`High payment amount encoded in QR (Rs. ${am}). Standard retail transfers recommend caution.`);
      }

      return {
        rawPayload: trimmed,
        type: 'UPI_PAYMENT',
        upiDetails: {
          payeeVpa: pa,
          payeeName: pn,
          amount: am,
          transactionNote: tn,
          merchantCode: mc,
          currency: cu,
        },
        flags,
      };
    } catch {
      flags.push('Malformed UPI URI parameter formatting');
    }
  }

  // 2. URL
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      rawPayload: trimmed,
      type: 'WEBSITE_URL',
      destinationUrl: trimmed,
      flags: ['QR contains an external website link rather than a direct payment request'],
    };
  }

  // 3. Fallback generic text
  return {
    rawPayload: trimmed,
    type: 'TEXT_OR_DATA',
    flags: ['Decoded QR payload does not match standard UPI payment specifications'],
  };
}
