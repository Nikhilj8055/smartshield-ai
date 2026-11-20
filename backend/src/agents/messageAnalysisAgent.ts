import { AgentResult } from './agentTypes';
import { ThreatIndicator, ExtractedEntities } from '../types';
import { COERCIVE_PATTERNS } from '../intelligence/threatFeeds';
import { v4 as uuidv4 } from 'uuid';

export class MessageAnalysisAgent {
  public readonly name = 'Message Analysis Agent';

  public async analyze(
    investigationId: string,
    evidenceId: string,
    text: string
  ): Promise<AgentResult> {
    const startTime = Date.now();
    const cleanText = text.trim();

    // 1. Entity Extraction
    const extractedEntities: ExtractedEntities = {
      urls: this.extractUrls(cleanText),
      phones: this.extractPhones(cleanText),
      emails: this.extractEmails(cleanText),
      upiIds: this.extractUpiIds(cleanText),
      organizations: this.extractOrganizations(cleanText),
      amounts: this.extractAmounts(cleanText),
      dates: this.extractDates(cleanText),
      remoteAccessApps: this.extractRemoteApps(cleanText),
    };

    const indicators: ThreatIndicator[] = [];
    const uncertainties: string[] = [];

    // 2. Pattern Matching via Threat Feeds
    for (const pattern of COERCIVE_PATTERNS) {
      if (pattern.regex.test(cleanText)) {
        indicators.push({
          id: uuidv4(),
          investigation_id: investigationId,
          evidence_id: evidenceId,
          indicator_type: pattern.label,
          category: pattern.category,
          severity: pattern.severity,
          confidence: 90,
          explanation: pattern.explanation,
          raw_matched_pattern: pattern.regex.source,
          source: 'Message Analysis Agent (Pattern Recognizer)',
          verification_status: 'AUTOMATED_MATCH',
        });
      }
    }

    // 3. Contextual Checks (Multi-signal logic)
    // Threat of OTP/PIN extraction
    if (/(otp|one\s+time\s+password|upi\s+pin|atm\s+pin|cvv|password)\b/i.test(cleanText) &&
        /(share|send|enter|verify|provide|forward)/i.test(cleanText)) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Credential & OTP Harvesting Request',
        category: 'CREDENTIAL_HARVESTING',
        severity: 'CRITICAL',
        confidence: 95,
        explanation: 'Message directly solicits sensitive one-time credentials, PIN, or CVV. Legitimate banks strictly forbid asking for PIN/OTP.',
        source: 'Message Analysis Agent (Rule Engine)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    // Remote Access Software Alert
    if (extractedEntities.remoteAccessApps.length > 0) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Remote-Access Tool Instruction',
        category: 'REMOTE_ACCESS',
        severity: 'CRITICAL',
        confidence: 95,
        explanation: `Message instructs downloading remote management tool (${extractedEntities.remoteAccessApps.join(', ')}), exposing device screen and incoming SMS.`,
        source: 'Message Analysis Agent (App Registry)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    // Check for missing context
    if (extractedEntities.urls.length > 0 && !extractedEntities.organizations.length) {
      uncertainties.push('Message contains hyperlinks but does not identify a verified corporate sender.');
    }
    if (extractedEntities.amounts.length > 0 && !extractedEntities.dates.length) {
      uncertainties.push('Financial figure stated without clear transactional invoice date or reference.');
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      agentName: this.name,
      executionTimeMs,
      confidence: indicators.length > 0 ? 92 : 80,
      extractedEntities,
      indicators,
      summary: indicators.length > 0
        ? `Identified ${indicators.length} threat indicator(s) including ${indicators.map((i) => i.indicator_type).join(', ')}.`
        : 'No overt coercive, phishing, or financial fraud patterns detected in message body.',
      uncertainties,
    };
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]*)/gi;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches.map((u) => u.replace(/[.,;!?)]+$/, ''))));
  }

  private extractPhones(text: string): string[] {
    const phoneRegex = /(\+?91[\s-]?)?[6-9]\d{9}\b/g;
    const matches = text.match(phoneRegex) || [];
    return Array.from(new Set(matches.map((p) => p.replace(/\D/g, '').slice(-10))));
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return Array.from(new Set(matches.map((e) => e.toLowerCase())));
  }

  private extractUpiIds(text: string): string[] {
    const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@(okhdfcbank|okaxis|oksbi|okicici|ybl|ibl|axl|paytm|upi|apl|rapl|sbi|kotak|barodampay|federal)/gi;
    const matches = text.match(upiRegex) || [];
    return Array.from(new Set(matches.map((u) => u.toLowerCase())));
  }

  private extractOrganizations(text: string): string[] {
    const orgs: string[] = [];
    const orgKeywords = [
      'SBI', 'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank', 'PNB',
      'Axis Bank', 'Paytm', 'PhonePe', 'Google Pay', 'India Post', 'CBI', 'Cyber Crime',
      'Mumbai Police', 'Delhi Police', 'Reserve Bank of India', 'RBI', 'Electricity Department',
      'FedEx', 'DHL', 'BlueDart', 'Telecom Regulatory Authority', 'TRAI'
    ];
    for (const org of orgKeywords) {
      const reg = new RegExp(`\\b${org}\\b`, 'i');
      if (reg.test(text)) {
        orgs.push(org);
      }
    }
    return Array.from(new Set(orgs));
  }

  private extractAmounts(text: string): string[] {
    const amtRegex = /(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi;
    const matches = text.match(amtRegex) || [];
    return Array.from(new Set(matches));
  }

  private extractDates(text: string): string[] {
    const dateRegex = /\b(?:\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}|today|tonight|immediately|within\s+\d+\s+hours?)\b/gi;
    const matches = text.match(dateRegex) || [];
    return Array.from(new Set(matches));
  }

  private extractRemoteApps(text: string): string[] {
    const apps = ['AnyDesk', 'TeamViewer', 'RustDesk', 'QuickSupport', 'AirDroid', 'Splashtop'];
    return apps.filter((app) => new RegExp(`\\b${app}\\b`, 'i').test(text));
  }
}

export const messageAnalysisAgent = new MessageAnalysisAgent();
