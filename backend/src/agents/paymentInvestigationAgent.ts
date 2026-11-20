import { AgentResult } from './agentTypes';
import { ThreatIndicator, ExtractedEntities, PaymentInvestigation } from '../types';
import { validateUpiSyntax, decodeQrPayload } from '../utils/upiHelper';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentInvestigationInput {
  upiId?: string;
  qrPayload?: string;
  amount?: number;
  paymentPurpose?: string;
  recipientName?: string;
  relatedMessageText?: string;
}

export class PaymentInvestigationAgent {
  public readonly name = 'Payment Investigation Agent';

  public async analyze(
    investigationId: string,
    evidenceId: string,
    input: PaymentInvestigationInput
  ): Promise<AgentResult & { paymentSummary: Partial<PaymentInvestigation> }> {
    const startTime = Date.now();
    const indicators: ThreatIndicator[] = [];
    const uncertainties: string[] = [];

    const extractedEntities: ExtractedEntities = {
      urls: [],
      phones: [],
      emails: [],
      upiIds: [],
      organizations: [],
      amounts: input.amount ? [`Rs. ${input.amount}`] : [],
      dates: [],
      remoteAccessApps: [],
    };

    // 1. QR Code Payload Investigation
    let activeUpi = input.upiId;
    let activePayeeName = input.recipientName;
    let activeAmount = input.amount;

    if (input.qrPayload) {
      const qrMeta = decodeQrPayload(input.qrPayload);

      if (qrMeta.type === 'WEBSITE_URL' && qrMeta.destinationUrl) {
        extractedEntities.urls.push(qrMeta.destinationUrl);
        indicators.push({
          id: uuidv4(),
          investigation_id: investigationId,
          evidence_id: evidenceId,
          indicator_type: 'Non-Standard Payment QR Code',
          category: 'MALICIOUS_LINK',
          severity: 'HIGH',
          confidence: 90,
          explanation: 'The scanned QR code redirects to an external webpage rather than invoking a direct UPI banking intent.',
          source: 'Payment Investigation Agent (QR Decoder)',
          verification_status: 'AUTOMATED_MATCH',
        });
      } else if (qrMeta.type === 'UPI_PAYMENT' && qrMeta.upiDetails) {
        if (qrMeta.upiDetails.payeeVpa) {
          activeUpi = qrMeta.upiDetails.payeeVpa;
          extractedEntities.upiIds.push(activeUpi);
        }
        if (qrMeta.upiDetails.payeeName) {
          activePayeeName = qrMeta.upiDetails.payeeName;
        }
        if (qrMeta.upiDetails.amount) {
          activeAmount = qrMeta.upiDetails.amount;
          extractedEntities.amounts.push(`Rs. ${activeAmount}`);
        }
      }
    }

    // 2. UPI Syntax & Reputation Check
    if (activeUpi) {
      extractedEntities.upiIds.push(activeUpi);
      const upiResult = validateUpiSyntax(activeUpi);

      if (!upiResult.isValidSyntax) {
        indicators.push({
          id: uuidv4(),
          investigation_id: investigationId,
          evidence_id: evidenceId,
          indicator_type: 'Malformed UPI Virtual Payment Address',
          category: 'IDENTITY_DECEPTION',
          severity: 'MEDIUM',
          confidence: 85,
          explanation: `The VPA "${activeUpi}" violates official NPCI UPI syntax standards.`,
          source: 'Payment Investigation Agent (UPI Registry)',
          verification_status: 'AUTOMATED_MATCH',
        });
      } else if (!upiResult.isRecognizedPspHandle) {
        indicators.push({
          id: uuidv4(),
          investigation_id: investigationId,
          evidence_id: evidenceId,
          indicator_type: 'Unrecognized UPI Banking PSP Handle',
          category: 'IDENTITY_DECEPTION',
          severity: 'MEDIUM',
          confidence: 75,
          explanation: `The bank handle "@${upiResult.handle}" is not in the recognized list of major Indian payment service providers.`,
          source: 'Payment Investigation Agent (Handle Validator)',
          verification_status: 'AUTOMATED_MATCH',
        });
      }
    }

    // 3. Payment Context & Deception Analysis
    const contextText = `${input.paymentPurpose || ''} ${input.relatedMessageText || ''}`.toLowerCase();

    // Pay-to-receive money scam (OLX, refund, lottery, cashback)
    if (
      /(receive|credit|accept|refund|cashback|collect|claim)\s+(money|rs|amount|funds)/i.test(contextText) &&
      /(scan|enter\s+pin|pay|approve)/i.test(contextText)
    ) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Pay-To-Receive Money Deception',
        category: 'FINANCIAL',
        severity: 'CRITICAL',
        confidence: 96,
        explanation: 'Perpetrator claims you must scan a QR or enter your UPI PIN to RECEIVE funds. Entering a UPI PIN always transfers money OUT of your bank account.',
        source: 'Payment Investigation Agent (Context Engine)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    // Advance fee for Job / Courier / Loan processing
    if (
      /(registration\s+fee|courier\s+fee|customs\s+duty|processing\s+charge|security\s+deposit)\b/i.test(contextText) &&
      /(job|offer|parcel|delivery|loan|clearance)/i.test(contextText)
    ) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Advance Fee & Security Deposit Scam Pattern',
        category: 'FINANCIAL',
        severity: 'HIGH',
        confidence: 90,
        explanation: 'Legitimate employers and courier companies do not require up-front personal UPI transfers for recruitment or parcel delivery.',
        source: 'Payment Investigation Agent (Context Engine)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    // High Urgency Payment
    if (/(immediately|within\s+\d+\s+minutes?|emergency|urgent\s+clearance)/i.test(contextText)) {
      indicators.push({
        id: uuidv4(),
        investigation_id: investigationId,
        evidence_id: evidenceId,
        indicator_type: 'Artificial Payment Time-Pressure',
        category: 'URGENCY',
        severity: 'HIGH',
        confidence: 85,
        explanation: 'Severe time constraints applied to rush the payment decision before the user can verify receiver identity.',
        source: 'Payment Investigation Agent (Context Engine)',
        verification_status: 'AUTOMATED_MATCH',
      });
    }

    if (!activeUpi && !input.qrPayload) {
      uncertainties.push('No direct UPI VPA or QR payload supplied for technical syntax verification.');
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      agentName: this.name,
      executionTimeMs,
      confidence: indicators.length > 0 ? 94 : 85,
      extractedEntities,
      indicators,
      summary: indicators.length > 0
        ? `Detected ${indicators.length} payment risk indicator(s) including ${indicators.map((i) => i.indicator_type).join(', ')}.`
        : 'Payment parameters and recipient identifiers match standard syntax without overt fraud markers.',
      uncertainties,
      paymentSummary: {
        upi_id: activeUpi,
        recipient_name: activePayeeName,
        qr_payload: input.qrPayload,
        amount: activeAmount,
        payment_purpose: input.paymentPurpose,
      },
    };
  }
}

export const paymentInvestigationAgent = new PaymentInvestigationAgent();
