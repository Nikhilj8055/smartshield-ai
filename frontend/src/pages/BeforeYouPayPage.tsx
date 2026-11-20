import React, { useState } from 'react';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { CreditCard, QrCode, AlertTriangle, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

export const BeforeYouPayPage: React.FC = () => {
  const [upiId, setUpiId] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [paymentPurpose, setPaymentPurpose] = useState('');
  const [relatedMessage, setRelatedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.checkPayment({
        upiId: upiId || undefined,
        qrPayload: qrPayload || undefined,
        amount: amount ? Number(amount) : undefined,
        recipientName: recipientName || undefined,
        paymentPurpose: paymentPurpose || undefined,
        relatedMessageText: relatedMessage || undefined,
      });

      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Before-You-Pay Protection</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Verify Before Authorizing Any Payment
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto">
          Scammers trick victims with fake QR codes and reversed collect requests. Verify receiver handles and detect deception before you pay.
        </p>
      </div>

      {/* Critical Indian Banking Warning Box */}
      <div className="p-4 bg-amber-50 rounded-apple border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Golden Rule of UPI:</p>
          <p className="leading-relaxed">
            You <span className="font-bold underline">NEVER</span> need to enter your UPI PIN or scan a QR code to RECEIVE money. Entering your PIN always deducts funds from your bank account.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-apple border border-border p-6 sm:p-8 shadow-subtle space-y-6">
        <form onSubmit={handleInspect} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                UPI ID (VPA)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="merchant@okhdfcbank"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-xs font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Claimed Recipient Name
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Ramesh Singh / OLX Buyer"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Stated Payment Purpose
              </label>
              <input
                type="text"
                value={paymentPurpose}
                onChange={(e) => setPaymentPurpose(e.target.value)}
                placeholder="e.g. Courier registration fee, OLX advance"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              QR Code Payload / Decoded String (Optional)
            </label>
            <input
              type="text"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder="upi://pay?pa=... or scanned URL"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-xs font-mono text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              Accompanying Message or Seller Instructions
            </label>
            <textarea
              rows={3}
              value={relatedMessage}
              onChange={(e) => setRelatedMessage(e.target.value)}
              placeholder="e.g. Buyer asked to scan QR to approve refund credit of Rs 15000..."
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!upiId && !qrPayload)}
            className="w-full py-3 rounded-full bg-accent text-white font-medium hover:bg-accent-hover transition-colors shadow-subtle flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validating Payment Parameters...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Verify Payment Safety</span>
              </>
            )}
          </button>
        </form>

        {/* Results Card */}
        {result && (
          <div className="pt-6 border-t border-border space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted font-semibold">Assessment Result</span>
                <div className="flex items-center gap-2 mt-1">
                  <RiskBadge level={result.riskLevel} />
                  <span className="text-sm font-semibold text-foreground">Score: {result.riskScore}/100</span>
                </div>
              </div>
              <span className="text-xs text-muted">Confidence: {result.confidence}%</span>
            </div>

            <p className="text-xs text-foreground leading-relaxed bg-background p-3 rounded-apple-sm border border-border">
              {result.summary}
            </p>

            {result.indicators?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Identified Risk Markers</h4>
                {result.indicators.map((ind: any, i: number) => (
                  <div key={i} className="p-3 bg-red-50/50 rounded-apple-sm border border-red-100 text-xs text-red-950 space-y-1">
                    <p className="font-semibold text-red-700">{ind.indicator_type}</p>
                    <p className="text-red-900 leading-relaxed">{ind.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
