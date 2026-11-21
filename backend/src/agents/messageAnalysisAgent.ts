
import { v4 as uuidv4 } from 'uuid';

import { AgentResult } from './agentTypes';
import {
  ThreatIndicator,
  ExtractedEntities,
} from '../types';

const patterns = [
  {
    name: 'URGENT_ACTION',
    category: 'URGENCY',
    severity: 'HIGH',
    regex: /\b(urgent|immediately|right now|act now|within \d+ hours?|expires today|last chance)\b/i,
    explanation: 'The message pressures the recipient to act quickly.',
  },
  {
    name: 'ACCOUNT_THREAT',
    category: 'COERCION',
    severity: 'CRITICAL',
    regex: /\b(account (will be|has been) (blocked|suspended|frozen)|account closure|kyc will expire|your account will be disabled)\b/i,
    explanation: 'The message threatens account suspension or loss of access.',
  },
  {
    name: 'FINANCIAL_REQUEST',
    category: 'FINANCIAL',
    severity: 'HIGH',
    regex: /\b(send money|transfer money|pay now|make a payment|processing fee|security deposit|refund fee)\b/i,
    explanation: 'The message requests a financial transaction.',
  },
  {
    name: 'IMPERSONATION',
    category: 'IMPERSONATION',
    severity: 'HIGH',
    regex: /\b(we are from (your )?(bank|police)|income tax department|government officer|customer care executive|official support team)\b/i,
    explanation: 'The sender may be impersonating an official organisation.',
  },
  {
    name: 'OTP_REQUEST',
    category: 'CREDENTIAL_HARVESTING',
    severity: 'CRITICAL',
    regex: /\b(share|send|tell us|provide|enter).{0,30}\b(otp|one.time password|pin|password|cvv)\b/i,
    explanation: 'The message asks for sensitive authentication information.',
  },
  {
    name: 'REMOTE_ACCESS',
    category: 'REMOTE_ACCESS',
    severity: 'CRITICAL',
    regex: /\b(anydesk|teamviewer|remote access|screen sharing app|install this app to help you)\b/i,
    explanation: 'The message encourages remote access to the device.',
  },
  {
    name: 'JOB_SCAM',
    category: 'FINANCIAL',
    severity: 'HIGH',
    regex: /\b(part.time job|work from home|daily income|earn \₹?\d+|registration fee|task completion|like and subscribe to earn)\b/i,
    explanation: 'The message contains job or task-based earning claims commonly associated with scams.',
  },
  {
    name: 'PRIZE_SCAM',
    category: 'FINANCIAL',
    severity: 'HIGH',
    regex: /\b(you have won|congratulations.*winner|claim your prize|lottery winner|free gift)\b/i,
    explanation: 'The message claims the recipient has won a prize or reward.',
  },
  {
    name: 'SUSPICIOUS_LINK',
    category: 'MALICIOUS_LINK',
    severity: 'HIGH',
    regex: /\bhttps?:\/\/[^\s]+/i,
    explanation: 'The message contains a link that should be checked before opening.',
  },
] as const;

function extractEntities(text: string): ExtractedEntities {
  const urls = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  const phones = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}\b/g) ?? [];
  const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const upiIds = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z]{2,}/g) ?? [];
  const amounts = text.match(/(?:₹|rs\.?\s?)\s?\d+(?:,\d{3})*(?:\.\d{1,2})?/gi) ?? [];
  const dates = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) ?? [];

  const remoteAccessApps = [
    'AnyDesk',
    'TeamViewer',
    'QuickSupport',
    'AirDroid',
  ].filter((app) => text.toLowerCase().includes(app.toLowerCase()));

  return {
    urls: [...new Set(urls)],
    phones: [...new Set(phones)],
    emails: [...new Set(emails)],
    upiIds: [...new Set(upiIds)],
    organizations: [],
    amounts: [...new Set(amounts)],
    dates: [...new Set(dates)],
    remoteAccessApps,
  };
}

function createIndicator(
  investigationId: string,
  evidenceId: string,
  pattern: (typeof patterns)[number],
  matchedText: string
): ThreatIndicator {
  return {
    id: uuidv4(),
    investigation_id: investigationId,
    evidence_id: evidenceId,
    indicator_type: pattern.name,
    category: pattern.category,
    severity: pattern.severity,
    confidence: 0.85,
    explanation: pattern.explanation,
    raw_matched_pattern: matchedText,
    source: 'MESSAGE_ANALYSIS_AGENT',
    verification_status: 'UNVERIFIED' as ThreatIndicator['verification_status'],
    created_at: new Date().toISOString(),
  };
}

export const messageAnalysisAgent = {
  async analyze(
    investigationId: string,
    evidenceId: string,
    text: string
  ): Promise<AgentResult> {
    const startTime = Date.now();

    const indicators: ThreatIndicator[] = [];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);

      if (match) {
        indicators.push(
          createIndicator(
            investigationId,
            evidenceId,
            pattern,
            match[0]
          )
        );
      }
    }

    const extractedEntities = extractEntities(text);

    const highestSeverity = indicators.some(
      (indicator) => indicator.severity === 'CRITICAL'
    )
      ? 'critical'
      : indicators.some((indicator) => indicator.severity === 'HIGH')
        ? 'high'
        : indicators.length > 0
          ? 'medium'
          : 'low';

    const confidence =
      indicators.length > 0
        ? Math.min(0.95, 0.65 + indicators.length * 0.08)
        : 0.4;

    const summary =
      indicators.length > 0
        ? `Detected ${indicators.length} suspicious signal(s). Highest detected severity: ${highestSeverity}.`
        : 'No known scam patterns were detected. This does not guarantee that the message is safe.';

    const uncertainties: string[] = [];

    if (indicators.length === 0) {
      uncertainties.push(
        'No known suspicious patterns matched. New or disguised scam techniques may not be detected.'
      );
    }

    if (extractedEntities.urls.length > 0) {
      uncertainties.push(
        'Extracted URLs require separate URL intelligence analysis before their safety can be determined.'
      );
    }

    return {
      agentName: 'MessageAnalysisAgent',
      executionTimeMs: Date.now() - startTime,
      confidence,
      extractedEntities,
      indicators,
      summary,
      uncertainties,
    };
  },
};
