import { ThreatIndicator, RiskAssessment } from '../types';
import { config } from '../config';

export interface SafetyAdvisoryOutput {
  overallAssessment: string;
  whyFlagged: string[];
  whatToDoNow: string[];
  helplineInfo: {
    phone: string;
    portalUrl: string;
    instructions: string;
  };
  missingInformationPrompt: string[];
}

export class SafetyAdvisoryAgent {
  public readonly name = 'Safety Advisory Agent';

  public generateAdvisory(
    riskAssessment: RiskAssessment,
    indicators: ThreatIndicator[],
    uncertainties: string[]
  ): SafetyAdvisoryOutput {
    const level = riskAssessment.risk_level;
    const whyFlagged: string[] = [];
    const whatToDoNow: string[] = [];

    // 1. Build "Why was this flagged?" from verified indicators
    if (indicators.length === 0) {
      whyFlagged.push('No obvious malicious signatures, coercive language, or known fraud indicators were identified in the submitted materials.');
    } else {
      for (const ind of indicators) {
        whyFlagged.push(`[${ind.category}] ${ind.indicator_type}: ${ind.explanation}`);
      }
    }

    // 2. Build "What should I do now?" step-by-step guidance tailored to severity
    switch (level) {
      case 'CRITICAL':
        whatToDoNow.push('DO NOT transfer any money or approve any UPI collect requests under any circumstances.');
        whatToDoNow.push('If a caller claims to be CBI/Police or threatens "Digital Arrest", disconnect immediately. Indian law enforcement NEVER interrogates citizens or demands security bail via Skype/WhatsApp video calls.');
        whatToDoNow.push('If you downloaded AnyDesk, TeamViewer, or an unknown APK, immediately turn on Airplane Mode or turn off Wi-Fi/Mobile Data, and uninstall the app.');
        whatToDoNow.push(`Dial the National Cybercrime Helpline immediately at ${config.emergency.helpline1930} or report online at ${config.emergency.nationalPortal}`);
        whatToDoNow.push('Alert a trusted family member or advisor before taking any financial action.');
        break;

      case 'HIGH':
        whatToDoNow.push('Halt all interactions with the sender and do not click on the link or scan the QR code.');
        whatToDoNow.push('Verify the communication directly using official phone numbers or websites (e.g. check the back of your debit card for bank customer care numbers).');
        whatToDoNow.push('Remember: Scanning a QR code or entering your UPI PIN will ALWAYS send money from your account, never receive money.');
        whatToDoNow.push('Take screenshots of the messages and phone numbers for your records before blocking the contact.');
        break;

      case 'MEDIUM':
        whatToDoNow.push('Exercise caution. The source exhibits unusual markers or lacks verified brand authenticity.');
        whatToDoNow.push('Do not share personal details, PAN/Aadhaar numbers, or banking credentials.');
        whatToDoNow.push('Contact the organization directly through their verified official portal or app store application.');
        break;

      case 'LOW':
        whatToDoNow.push('The content appears consistent with routine communication.');
        whatToDoNow.push('Maintain standard security hygiene: never share SMS OTPs or passwords with anyone.');
        break;

      case 'INSUFFICIENT EVIDENCE':
      default:
        whatToDoNow.push('Please provide additional context, such as the full SMS text, the sender phone number, or the exact payment URL.');
        whatToDoNow.push('When in doubt, refrain from entering sensitive payment details.');
        break;
    }

    // 3. Overall non-technical assessment summary
    let overallAssessment = '';
    if (level === 'CRITICAL') {
      overallAssessment = 'CRITICAL THREAT: Severe manipulation or fraudulent intent detected. This interaction matches known extortion or theft tactics. Protect your funds and device immediately.';
    } else if (level === 'HIGH') {
      overallAssessment = 'HIGH RISK: Highly suspicious indicators identified. High likelihood of impersonation, phishing, or financial deception.';
    } else if (level === 'MEDIUM') {
      overallAssessment = 'MODERATE RISK: Irregular patterns detected. Proceed with extreme caution and seek secondary verification before sharing any information.';
    } else if (level === 'LOW') {
      overallAssessment = 'LOW RISK: No active fraud patterns or coercive indicators matched in the submitted evidence.';
    } else {
      overallAssessment = 'INSUFFICIENT EVIDENCE: The submitted data does not provide enough actionable indicators to form a conclusive risk determination.';
    }

    return {
      overallAssessment,
      whyFlagged,
      whatToDoNow,
      helplineInfo: {
        phone: config.emergency.helpline1930,
        portalUrl: config.emergency.nationalPortal,
        instructions: 'Call 1930 immediately within the golden hour if unauthorized funds were transferred.',
      },
      missingInformationPrompt: uncertainties,
    };
  }
}

export const safetyAdvisoryAgent = new SafetyAdvisoryAgent();
