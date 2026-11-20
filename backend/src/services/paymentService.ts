import { paymentInvestigationAgent, PaymentInvestigationInput } from '../agents/paymentInvestigationAgent';
import { v4 as uuidv4 } from 'uuid';
import { riskCalculator } from '../risk-engine/riskCalculator';

export class PaymentService {
  public async investigatePayment(input: PaymentInvestigationInput) {
    const tempInvestigationId = uuidv4();
    const tempEvidenceId = uuidv4();

    const result = await paymentInvestigationAgent.analyze(tempInvestigationId, tempEvidenceId, input);

    const tempEvidenceItem = {
      id: tempEvidenceId,
      investigation_id: tempInvestigationId,
      user_id: 'anonymous',
      evidence_type: (input.qrPayload ? 'QR' : 'UPI') as any,
      raw_content: `${input.upiId || ''} ${input.paymentPurpose || ''}`,
      extracted_entities: result.extractedEntities,
      reliability_score: 1.0,
      created_at: new Date().toISOString(),
    };

    const risk = riskCalculator.calculateRisk(tempInvestigationId, result.indicators, [tempEvidenceItem]);

    return {
      paymentSummary: result.paymentSummary,
      riskLevel: risk.risk_level,
      riskScore: risk.risk_score,
      confidence: result.confidence,
      indicators: result.indicators,
      summary: result.summary,
      uncertainties: result.uncertainties,
    };
  }
}

export const paymentService = new PaymentService();
