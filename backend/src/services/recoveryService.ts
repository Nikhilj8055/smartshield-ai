import { db } from '../repositories';
import { RecoveryCase } from '../types';
import { config } from '../config';

export class RecoveryService {
  public async createCase(
    userId: string,
    data: {
      incident_date: string;
      amount_lost: number;
      transaction_reference?: string;
      bank_name?: string;
      notes?: string;
      investigation_id?: string;
    }
  ): Promise<RecoveryCase> {
    const caseNumber = `CASE-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
const initialTimeline = [
  {
    date: new Date().toISOString(),
    step: '1. Incident Documented',
    description: 'Case registered with initial transaction details and timestamps preserved.',
    completed: true,
  },
  {
    date: new Date().toISOString(),
    step: '2. Evidence Collection',
    description: 'Collect and preserve transaction screenshots, bank statements, SMS alerts, call logs, and other relevant evidence.',
    completed: false,
  },
  {
    date: new Date().toISOString(),
    step: '3. Immediate Account & Device Quarantine',
    description: 'Ensure compromised cards/netbanking are blocked and remote-access apps uninstalled.',
    completed: false,
  },
  {
    date: new Date().toISOString(),
    step: '4. National Cybercrime Helpline (1930) Call',
    description: `Dial ${config.emergency.helpline1930} immediately with transaction reference (${data.transaction_reference || 'N/A'}) and bank name.`,
    completed: false,
  },
  {
    date: new Date().toISOString(),
    step: '5. Bank Fraud Escalation',
    description: `Contact ${data.bank_name || 'your bank'} fraud control unit to formally register an unauthorized transaction dispute.`,
    completed: false,
  },
  {
    date: new Date().toISOString(),
    step: '6. Official National Cybercrime Portal FIR',
    description: `File detailed complaint at ${config.emergency.nationalPortal} and retain the Acknowledgement Number.`,
    completed: false,
  },
  {
    date: new Date().toISOString(),
    step: '7. Nodal Officer Follow-Up',
    description: 'Provide written complaint and Cybercrime FIR copy to home branch manager within 3 business days.',
    completed: false,
  },
];
    return db.createRecoveryCase({
      user_id: userId,
      investigation_id: data.investigation_id,
      case_number: caseNumber,
      incident_date: data.incident_date,
      amount_lost: data.amount_lost,
      transaction_reference: data.transaction_reference,
      bank_name: data.bank_name,
      status: 'OPEN',
      notes: data.notes,
      timeline: initialTimeline,
    });
  }

  public async getCases(userId: string): Promise<RecoveryCase[]> {
    return db.getRecoveryCasesByUserId(userId);
  }

public async getCaseById(
  id: string,
  userId: string
): Promise<RecoveryCase | null> {
  return db.getRecoveryCaseById(id, userId);
}

  public async updateCase(
    id: string,
    userId: string,
    updates: Partial<RecoveryCase>
  ): Promise<RecoveryCase | null> {
    const existing = await this.getCaseById(id, userId);
    if (!existing) return null;
    return db.updateRecoveryCase(id, userId, updates);
  }
}

export const recoveryService = new RecoveryService();
