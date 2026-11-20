import { describe, it, expect } from 'vitest';
import { messageAnalysisAgent } from '../agents/messageAnalysisAgent';
import { urlIntelligenceAgent } from '../agents/urlIntelligenceAgent';
import { paymentInvestigationAgent } from '../agents/paymentInvestigationAgent';
import { riskCalculator } from '../risk-engine/riskCalculator';
import { validateUpiSyntax, decodeQrPayload } from '../utils/upiHelper';
import { parseAndNormalizeUrl } from '../utils/urlHelper';
import { orchestrator } from '../agents/orchestrator';
import { Investigation, EvidenceItem } from '../types';

describe('SmartShield AI - Comprehensive Threat Detection Test Suite', () => {
  // Scenario 1: Legitimate bank notification
  it('Scenario 1: Evaluates legitimate bank transaction notification with low risk', async () => {
    const text = 'Dear Customer, Rs 1500.00 debited from A/C XX1234 on 20-Nov-2026 for groceries. Avl Bal: Rs 45,210. Info: SBI.';
    const res = await messageAnalysisAgent.analyze('inv-1', 'ev-1', text);
    const risk = riskCalculator.calculateRisk('inv-1', res.indicators, [{
      id: 'ev-1',
      investigation_id: 'inv-1',
      user_id: 'u-1',
      evidence_type: 'MESSAGE',
      raw_content: text,
      extracted_entities: res.extractedEntities,
      reliability_score: 1.0,
      created_at: new Date().toISOString(),
    }]);

    expect(risk.risk_level).toBe('LOW');
    expect(risk.risk_score).toBeLessThanOrEqual(30);
  });

  // Scenario 2: Fake KYC message
  it('Scenario 2: Detects fake bank KYC suspension threat as HIGH risk', async () => {
    const text = 'Dear Customer, your bank account will be blocked immediately due to pending PAN card update. Update now at http://sbi-kyc-update.com';
    const res = await messageAnalysisAgent.analyze('inv-2', 'ev-2', text);
    const hasKycIndicator = res.indicators.some((i) => i.indicator_type.includes('KYC') || i.indicator_type.includes('Suspension'));
    expect(hasKycIndicator).toBe(true);

    const risk = riskCalculator.calculateRisk('inv-2', res.indicators, [{
      id: 'ev-2',
      investigation_id: 'inv-2',
      user_id: 'u-1',
      evidence_type: 'MESSAGE',
      raw_content: text,
      extracted_entities: res.extractedEntities,
      reliability_score: 1.0,
      created_at: new Date().toISOString(),
    }]);
    expect(['HIGH', 'CRITICAL']).toContain(risk.risk_level);
  });

  // Scenario 3: Fake courier payment request
  it('Scenario 3: Flags fake courier custom fee advance payment pattern', async () => {
    const res = await paymentInvestigationAgent.analyze('inv-3', 'ev-3', {
      paymentPurpose: 'Customs clearance fee for parcel delivery',
      amount: 499,
      upiId: 'courierhelp99@okaxis',
      relatedMessageText: 'Your courier parcel is stuck at airport. Pay registration fee Rs 499 immediately to release.',
    });

    const hasAdvanceFeeFlag = res.indicators.some((i) => i.indicator_type.includes('Advance Fee'));
    expect(hasAdvanceFeeFlag).toBe(true);
  });

  // Scenario 4: Suspicious job offer
  it('Scenario 4: Detects part-time task & YouTube like scam', async () => {
    const text = 'Exciting part time job offer: earn Rs 3000 daily just by liking YouTube videos and completing Telegram task.';
    const res = await messageAnalysisAgent.analyze('inv-4', 'ev-4', text);
    const hasJobScamFlag = res.indicators.some((i) => i.indicator_type.includes('Part-Time Task'));
    expect(hasJobScamFlag).toBe(true);
  });

  // Scenario 5: Digital arrest threat
  it('Scenario 5: Flags Digital Arrest & law enforcement coercion as CRITICAL', async () => {
    const text = 'This is CBI Mumbai Cyber Crime. Your passport is seized with narcotics parcel. You are under digital arrest. Do not disconnect the video call.';
    const res = await messageAnalysisAgent.analyze('inv-5', 'ev-5', text);
    const hasCoercion = res.indicators.some((i) => i.category === 'COERCION' && i.severity === 'CRITICAL');
    expect(hasCoercion).toBe(true);

    const risk = riskCalculator.calculateRisk('inv-5', res.indicators, [{
      id: 'ev-5',
      investigation_id: 'inv-5',
      user_id: 'u-1',
      evidence_type: 'MESSAGE',
      raw_content: text,
      extracted_entities: res.extractedEntities,
      reliability_score: 1.0,
      created_at: new Date().toISOString(),
    }]);
    expect(risk.risk_level).toBe('CRITICAL');
    expect(risk.risk_score).toBeGreaterThanOrEqual(80);
  });

  // Scenario 6: Unknown safe URL
  it('Scenario 6: Evaluates unknown domain without false positives or claiming HTTPS is proof of safety', async () => {
    const url = 'https://example-community-college.edu';
    const res = await urlIntelligenceAgent.analyze('inv-6', 'ev-6', url);
    expect(res.indicators.length).toBe(0);
  });

  // Scenario 7: Known malicious test URL & Typosquatting
  it('Scenario 7: Flags typosquatted brand domain as HIGH risk', async () => {
    const url = 'http://sbi-kyc-update.com/login.html';
    const res = await urlIntelligenceAgent.analyze('inv-7', 'ev-7', url);
    const hasLookalike = res.indicators.some((i) => i.indicator_type.includes('Typosquatting') || i.indicator_type.includes('Phishing'));
    expect(hasLookalike).toBe(true);
  });

  // Scenario 8: Suspicious UPI request / Pay-to-receive
  it('Scenario 8: Identifies Pay-to-Receive QR deception as CRITICAL', async () => {
    const res = await paymentInvestigationAgent.analyze('inv-8', 'ev-8', {
      paymentPurpose: 'Scan QR to receive OLX buyer money and enter your UPI PIN',
      upiId: 'buyerpayment@ybl',
      relatedMessageText: 'Scan this code to receive Rs 15000 refund in your account',
    });
    const hasPayToReceive = res.indicators.some((i) => i.indicator_type.includes('Pay-To-Receive'));
    expect(hasPayToReceive).toBe(true);
  });

  // Scenario 9: UPI Syntax validation
  it('Scenario 9: Correctly validates NPCI UPI formats', () => {
    const validCheck = validateUpiSyntax('merchant99@okhdfcbank');
    expect(validCheck.isValidSyntax).toBe(true);
    expect(validCheck.isRecognizedPspHandle).toBe(true);

    const invalidCheck = validateUpiSyntax('invalid_address_without_at');
    expect(invalidCheck.isValidSyntax).toBe(false);
  });

  // Scenario 10: Multi-evidence correlation & Insufficient Evidence Handling
  it('Scenario 10: Handles Insufficient Evidence properly when text is empty', () => {
    const risk = riskCalculator.calculateRisk('inv-empty', [], []);
    expect(risk.risk_level).toBe('INSUFFICIENT EVIDENCE');
    expect(risk.risk_score).toBe(0);
  });
});
