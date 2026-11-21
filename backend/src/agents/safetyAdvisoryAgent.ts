
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

    // ========================================
    // 1. EXPLAIN WHY THE CONTENT WAS FLAGGED
    // ========================================

    if (indicators.length === 0) {
      whyFlagged.push(
        'No configured suspicious patterns were detected in the submitted evidence.'
      );

      whyFlagged.push(
        'This does not guarantee that the message, website or sender is safe.'
      );
    } else {
      for (const indicator of indicators) {
        const verificationLabel =
          indicator.verification_status === 'INTELLIGENCE_CONFIRMED'
            ? 'External intelligence match'
            : indicator.verification_status === 'USER_REPORTED'
              ? 'User-reported information'
              : indicator.verification_status === 'DISMISSED'
                ? 'Dismissed finding'
                : 'Automated pattern match';

        whyFlagged.push(
          `[${indicator.severity}] ${indicator.indicator_type}: ${indicator.explanation} (Source: ${indicator.source}; Status: ${verificationLabel})`
        );
      }
    }

    // ========================================
    // 2. GENERAL SAFETY RULES
    // ========================================

    whatToDoNow.push(
      'Never share your OTP, UPI PIN, ATM PIN, CVV or banking password with another person.'
    );

    whatToDoNow.push(
      'Never approve a UPI payment request just to receive money.'
    );

    // ========================================
    // 3. ACTIONS BASED ON RISK LEVEL
    // ========================================

    switch (level) {
      case 'CRITICAL':

        whatToDoNow.unshift(
          'STOP. Do not transfer money, approve payment requests or share sensitive information with the sender.'
        );

        whatToDoNow.push(
          'Disconnect suspicious calls and do not follow instructions from someone threatening arrest, account blocking or immediate financial penalties.'
        );

        whatToDoNow.push(
          'If you installed remote-access software at the request of an unknown person, disconnect your device from the internet and contact your bank using its official number from a trusted device.'
        );

        whatToDoNow.push(
          'Preserve screenshots, messages, phone numbers, transaction IDs and other evidence. Do not delete conversations or suspicious files before preserving relevant evidence.'
        );

        whatToDoNow.push(
          'If money has been transferred without authorization, immediately contact your bank and call the National Cyber Crime Helpline at 1930. Also report at the official cybercrime portal.'
        );

        whatToDoNow.push(
          'Ask a trusted family member to help verify the situation before making further financial decisions.'
        );

        break;

      case 'HIGH':

        whatToDoNow.unshift(
          'Do not click the suspicious link, scan the QR code or make the requested payment.'
        );

        whatToDoNow.push(
          'Stop interacting with the suspicious sender until the communication has been independently verified.'
        );

        whatToDoNow.push(
          'Contact the claimed bank, company or government department through its independently verified official website or phone number.'
        );

        whatToDoNow.push(
          'Keep screenshots of the message, sender details and suspicious links for reporting.'
        );

        whatToDoNow.push(
          'If you have already shared banking credentials or transferred money, contact your bank immediately and call 1930 if financial fraud has occurred.'
        );

        break;

      case 'MEDIUM':

        whatToDoNow.unshift(
          'Be cautious. Some unusual or potentially deceptive patterns were detected.'
        );

        whatToDoNow.push(
          'Do not share Aadhaar, PAN, banking details or authentication codes with an unverified sender.'
        );

        whatToDoNow.push(
          'Check the website address carefully before entering personal information.'
        );

        whatToDoNow.push(
          'Verify the communication directly through the organization’s official application or website.'
        );

        whatToDoNow.push(
          'Do not make payments until the sender and purpose have been independently verified.'
        );

        break;

      case 'LOW':

        whatToDoNow.unshift(
          'No significant configured threat indicators were detected in the submitted evidence.'
        );

        whatToDoNow.push(
          'Continue using normal security precautions.'
        );

        whatToDoNow.push(
          'Check unexpected payment requests and links independently before acting.'
        );

        break;

      case 'INSUFFICIENT EVIDENCE':
      default:

        whatToDoNow.unshift(
          'There is not enough information to determine whether this interaction is fraudulent.'
        );

        whatToDoNow.push(
          'Do not make payments or share sensitive information until the situation is verified.'
        );

        whatToDoNow.push(
          'Provide the complete message, sender details, screenshot or suspicious URL for further investigation.'
        );

        break;
    }

    // ========================================
    // 4. OVERALL ASSESSMENT
    // ========================================

    const assessmentMessages: Record<string, string> = {
      CRITICAL:
        'CRITICAL RISK: Multiple serious warning signs were identified. Stop the interaction and protect your financial accounts and device immediately. This assessment indicates serious suspicion, not a legal determination of fraud.',

      HIGH:
        'HIGH RISK: Strong suspicious patterns were detected. Do not proceed with the requested action until the sender and communication are independently verified.',

      MEDIUM:
        'MODERATE RISK: Some unusual patterns were identified. Exercise caution and verify the information before sharing details or making payments.',

      LOW:
        'LOW RISK: No significant configured threat indicators were detected. This is not a guarantee that the communication is safe.',

      'INSUFFICIENT EVIDENCE':
        'INSUFFICIENT EVIDENCE: The submitted information is not enough to make a reliable assessment. Additional evidence is required.',
    };

    const overallAssessment =
      assessmentMessages[level] ||
      assessmentMessages['INSUFFICIENT EVIDENCE'];

    // ========================================
    // 5. INFORMATION REQUIRED FOR INVESTIGATION
    // ========================================

    const missingInformationPrompt = [
      ...new Set(
        uncertainties.filter(
          (item) => typeof item === 'string' && item.trim().length > 0
        )
      ),
    ];

    if (level === 'INSUFFICIENT EVIDENCE') {
      missingInformationPrompt.push(
        'Was this communication received through SMS, WhatsApp, email or a phone call?'
      );

      missingInformationPrompt.push(
        'Did the sender request money, an OTP, a PIN or access to your device?'
      );
    }

    // ========================================
    // 6. OFFICIAL REPORTING INFORMATION
    // ========================================

    return {
      overallAssessment,
      whyFlagged,
      whatToDoNow,

      helplineInfo: {
        phone: config.emergency.helpline1930,
        portalUrl: config.emergency.nationalPortal,
        instructions:
          'If you have lost money through suspected cyber fraud, contact your bank immediately and call 1930 as soon as possible. Preserve transaction details and report through the official cybercrime portal.',
      },

      missingInformationPrompt,
    };
  }
}

export const safetyAdvisoryAgent = new SafetyAdvisoryAgent();
