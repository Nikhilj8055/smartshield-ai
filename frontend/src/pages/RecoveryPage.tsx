import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RecoveryCase } from '../types';
import { LifeBuoy, Plus, PhoneCall, CheckCircle2, Clock, AlertCircle, FileText, ArrowRight, Loader2 } from 'lucide-react';

export const RecoveryPage: React.FC = () => {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form states
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountLost, setAmountLost] = useState('');
  const [txRef, setTxRef] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await api.listRecoveryCases();
        if (res.success && res.data) {
          setCases(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountLost) return;

    try {
      const res = await api.createRecoveryCase({
        incident_date: incidentDate,
        amount_lost: Number(amountLost),
        transaction_reference: txRef || undefined,
        bank_name: bankName || undefined,
        notes: notes || undefined,
      });

      if (res.success && res.data) {
        setCases([res.data, ...cases]);
        setCreating(false);
        setAmountLost('');
        setTxRef('');
        setBankName('');
        setNotes('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Incident Recovery Centre</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Step-by-Step Scam Recovery Command
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto">
          If you have sent money under deception, every minute counts. Follow this 6-stage response protocol to coordinate with banks and law enforcement.
        </p>
      </div>

      {/* Golden Hour Helpline Box */}
      <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Immediate Step</span>
          <h3 className="text-base font-semibold text-foreground">Dial 1930 Cybercrime Helpline Immediately</h3>
          <p className="text-xs text-muted">
            The first 2 to 3 hours ("Golden Period") is when suspect bank accounts can be frozen by nodal officers.
          </p>
        </div>

        <a
          href="tel:1930"
          className="px-6 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-subtle shrink-0 flex items-center gap-2"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call 1930</span>
        </a>
      </div>

      {/* Case Management Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Your Recovery Incident Cases</h2>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors shadow-subtle"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Incident File</span>
        </button>
      </div>

      {/* New Case Creation Modal / Form */}
      {creating && (
        <form onSubmit={handleCreateCase} className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-4 animate-in fade-in">
          <h3 className="text-sm font-semibold text-foreground">Log Financial Scam Incident</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Date of Incident</label>
              <input
                type="date"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Amount Transferred (₹)</label>
              <input
                type="number"
                required
                value={amountLost}
                onChange={(e) => setAmountLost(e.target.value)}
                placeholder="25000"
                className="w-full px-3 py-2 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Transaction Ref / UPI UTR Number</label>
              <input
                type="text"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="12-digit UTR or transaction ID"
                className="w-full px-3 py-2 bg-background border border-border rounded-apple-sm text-xs font-mono text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Your Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India, HDFC"
                className="w-full px-3 py-2 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Summary of Incident & Communication</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what occurred, scammer handle, platform used..."
              className="w-full px-3 py-2 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-3.5 py-1.5 text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-accent text-white text-xs font-medium hover:bg-accent-hover"
            >
              Generate Recovery Action Plan
            </button>
          </div>
        </form>
      )}

      {/* Cases Timeline List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading recovery cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 bg-surface rounded-apple border border-border text-center text-xs text-muted">
            No recovery cases recorded. Register an incident file if unauthorized transactions occurred.
          </div>
        ) : (
          cases.map((c) => (
            <div key={c.id} className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">{c.case_number}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-accent font-semibold text-[10px]">
                      STATUS: {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Loss: <span className="font-semibold text-foreground">₹{c.amount_lost.toLocaleString('en-IN')}</span> · Bank: {c.bank_name || 'Unspecified'} · Date: {c.incident_date}
                  </p>
                </div>
              </div>

              {/* 6-Stage Timeline Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Guided Recovery Pipeline</h4>
                <div className="space-y-2">
                  {c.timeline?.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-apple-sm border text-xs transition-colors ${
                        step.completed
                          ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                          : 'bg-background border-border text-foreground'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          step.completed ? 'text-emerald-600' : 'text-gray-300'
                        }`}
                      />
                      <div className="space-y-0.5">
                        <p className="font-semibold">{step.step}</p>
                        <p className="text-muted leading-relaxed text-[11px]">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
