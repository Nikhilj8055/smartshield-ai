import crypto from 'crypto';

export function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function anonymizeText(text: string): string {
  // Redact Indian phone numbers (10 digits, +91)
  let anonymized = text.replace(/(\+?91[\s-]?)?[6-9]\d{9}/g, '[REDACTED_PHONE]');
  // Redact OTPs (4-6 digits with keywords like otp, code, pin)
  anonymized = anonymized.replace(/\b\d{4,6}\b/g, (match) => {
    return '[REDACTED_CODE]';
  });
  // Redact emails
  anonymized = anonymized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  // Redact UPI IDs
  anonymized = anonymized.replace(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g, '[REDACTED_UPI]');
  return anonymized;
}
