import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';

export const paymentController = {
  async investigate(req: Request, res: Response) {
    try {
      const { upiId, qrPayload, amount, paymentPurpose, recipientName, relatedMessageText } = req.body;

      if (!upiId && !qrPayload) {
        return res.status(400).json({ success: false, error: 'Either UPI ID or QR payload is required' });
      }

      const result = await paymentService.investigatePayment({
        upiId,
        qrPayload,
        amount: amount ? Number(amount) : undefined,
        paymentPurpose,
        recipientName,
        relatedMessageText,
      });

      return res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
