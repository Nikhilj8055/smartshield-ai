import { db } from '../repositories';
import { messageAnalysisAgent } from '../agents/messageAnalysisAgent';
import { EmergencyContact } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export class EmergencyService {
  public async triageEmergency(text: string) {
    const tempInvId = uuidv4();
    const tempEvId = uuidv4();

    const analysis = await messageAnalysisAgent.analyze(tempInvId, tempEvId, text);

    // Isolate critical coercion or digital arrest indicators
    const coercionIndicators = analysis.indicators.filter(
      (ind) => ind.category === 'COERCION' || ind.category === 'REMOTE_ACCESS' || ind.severity === 'CRITICAL'
    );

    const isDigitalArrestDetected = analysis.indicators.some((ind) =>
      ind.indicator_type.toLowerCase().includes('digital arrest') ||
      ind.explanation.toLowerCase().includes('digital arrest') ||
      ind.explanation.toLowerCase().includes('video interrogation')
    );

    const isRemoteAccessDetected = analysis.extractedEntities.remoteAccessApps.length > 0;

    return {
      isEmergency: coercionIndicators.length > 0,
      isDigitalArrestDetected,
      isRemoteAccessDetected,
      indicators: coercionIndicators,
      remoteAccessApps: analysis.extractedEntities.remoteAccessApps,
      immediateActionGuide: [
        'DISCONNECT THE CALL IMMEDIATELY. Indian law enforcement (CBI, Police, ED, Customs) NEVER conducts arrests or takes statements via WhatsApp or Skype video calls.',
        'DO NOT TRANSFER ANY "CLEARANCE" OR "VERIFICATION" MONEY. Genuine courts and police officers never demand funds transferred to private accounts.',
        'IF ANY SCREEN-SHARING APP (AnyDesk, TeamViewer, RustDesk) WAS INSTALLED: Turn off Wi-Fi and Mobile Data immediately, then delete the app from your device.',
        `CALL 1930 IMMEDIATELY: If you transferred funds, calling the National Cybercrime Helpline 1930 within the first hour gives banks the best chance to freeze the suspect accounts.`,
        'INFORM A TRUSTED FAMILY MEMBER: Do not suffer in secrecy. Scammers count on fear and shame to keep you isolated.',
      ],
      helpline: config.emergency.helpline1930,
      portal: config.emergency.nationalPortal,
    };
  }

  public async getContacts(userId: string): Promise<EmergencyContact[]> {
    return db.getEmergencyContacts(userId);
  }

  public async addContact(
    userId: string,
    data: { name: string; phone_number: string; relationship: string; consent_given: boolean }
  ): Promise<EmergencyContact> {
    if (!data.consent_given) {
      throw new Error('Explicit consent is required to register an emergency contact.');
    }

    return db.addEmergencyContact({
      user_id: userId,
      name: data.name,
      phone_number: data.phone_number,
      relationship: data.relationship,
      is_active: true,
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
    });
  }

  public async removeContact(id: string, userId: string): Promise<boolean> {
    return db.removeEmergencyContact(id, userId);
  }
}

export const emergencyService = new EmergencyService();
