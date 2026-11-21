import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { emergencyService } from '../services/emergencyService';

export const emergencyController = {
  async triage(req: AuthenticatedRequest, res: Response) {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, error: 'Statement or message text is required' });
      }

      const result = await emergencyService.triageEmergency(text);
      return res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getContacts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

if (!userId) {
  return res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
}
      const contacts = await emergencyService.getContacts(userId);
      return res.status(200).json({ success: true, data: contacts });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async addContact(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

if (!userId) {
  return res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
}
      const { name, phone_number, relationship, consent_given } = req.body;

      if (!name || !phone_number || !relationship) {
        return res.status(400).json({ success: false, error: 'Name, phone number and relationship are required' });
      }

      const contact = await emergencyService.addContact(userId, {
        name,
        phone_number,
        relationship,
        consent_given: Boolean(consent_given),
      });

      return res.status(201).json({ success: true, data: contact });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async deleteContact(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

if (!userId) {
  return res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
}
      const id = String(req.params.id);
      const success = await emergencyService.removeContact(id, userId);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Contact not found or unauthorized' });
      }
      return res.status(200).json({ success: true, message: 'Contact removed' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
