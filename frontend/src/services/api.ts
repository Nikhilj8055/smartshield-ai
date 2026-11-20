import { Investigation, RecoveryCase, EmergencyContact, ScamPatternCluster } from '../types';

const API_BASE = '/api/v1';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('smartshield_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async register(email: string, password: string, fullName: string, phone?: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, phone_number: phone }),
    });
    return res.json();
  },

  async me() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Investigations
  async listInvestigations(): Promise<{ success: boolean; data: Investigation[] }> {
    const res = await fetch(`${API_BASE}/investigations`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getInvestigation(id: string): Promise<{ success: boolean; data: Investigation }> {
    const res = await fetch(`${API_BASE}/investigations/${id}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async createInvestigation(title: string, type: string, content?: string) {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, type, content }),
    });
    return res.json();
  },

  async addEvidence(investigationId: string, formData: FormData) {
    const token = localStorage.getItem('smartshield_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/investigations/${investigationId}/evidence`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },

  // Direct Analysis
  async analyzeMessage(text: string) {
    const res = await fetch(`${API_BASE}/analyze/message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  async analyzeUrl(url: string) {
    const res = await fetch(`${API_BASE}/analyze/url`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url }),
    });
    return res.json();
  },

  async analyzeScreenshot(formData: FormData) {
    const token = localStorage.getItem('smartshield_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/analyze/screenshot`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },

  // Before-You-Pay
  async checkPayment(payload: {
    upiId?: string;
    qrPayload?: string;
    amount?: number;
    paymentPurpose?: string;
    recipientName?: string;
    relatedMessageText?: string;
  }) {
    const res = await fetch(`${API_BASE}/payment/investigate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Emergency / Coercion
  async triageEmergency(text: string) {
    const res = await fetch(`${API_BASE}/emergency/triage`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  async getEmergencyContacts(): Promise<{ success: boolean; data: EmergencyContact[] }> {
    const res = await fetch(`${API_BASE}/emergency/contacts`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async addEmergencyContact(contact: {
    name: string;
    phone_number: string;
    relationship: string;
    consent_given: boolean;
  }) {
    const res = await fetch(`${API_BASE}/emergency/contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(contact),
    });
    return res.json();
  },

  async deleteEmergencyContact(id: string) {
    const res = await fetch(`${API_BASE}/emergency/contacts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Scam Patterns
  async getPatternClusters(): Promise<{ success: boolean; data: ScamPatternCluster[] }> {
    const res = await fetch(`${API_BASE}/patterns/clusters`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async reportScam(text: string, consentGiven: boolean) {
    const res = await fetch(`${API_BASE}/patterns/report`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, consentGiven }),
    });
    return res.json();
  },

  // Recovery Cases
  async listRecoveryCases(): Promise<{ success: boolean; data: RecoveryCase[] }> {
    const res = await fetch(`${API_BASE}/recovery/cases`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async createRecoveryCase(data: {
    incident_date: string;
    amount_lost: number;
    transaction_reference?: string;
    bank_name?: string;
    notes?: string;
  }) {
    const res = await fetch(`${API_BASE}/recovery/cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateRecoveryCase(id: string, updates: Partial<RecoveryCase>) {
    const res = await fetch(`${API_BASE}/recovery/cases/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  },
};
