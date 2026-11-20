import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScamPatternCluster } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { Compass, Users, CheckCircle, Shield, Loader2, Send } from 'lucide-react';

export const ScamDiscoveryPage: React.FC = () => {
  const [clusters, setClusters] = useState<ScamPatternCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportText, setReportText] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function fetchClusters() {
      try {
        const res = await api.getPatternClusters();
        if (res.success && res.data) {
          setClusters(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchClusters();
  }, []);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim() || !consentGiven) return;
    setSubmitting(true);

    try {
      const res = await api.reportScam(reportText, true);
      if (res.success) {
        setSubmitSuccess(true);
        setReportText('');
        setConsentGiven(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-accent text-xs font-semibold border border-blue-200">
          <Compass className="w-3.5 h-3.5" />
          <span>Emerging Scam Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Verified Scam Patterns & Modus Operandi
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto">
          Community-informed, privacy-filtered threat clusters identifying active cybercrime schemes targeting Indian citizens.
        </p>
      </div>

      {/* Verified Clusters List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Active Pattern Clusters</h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading verified pattern intelligence...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-5 bg-surface rounded-apple border border-border shadow-subtle flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <RiskBadge level={cluster.risk_level} size="sm" />
                    <span className="text-[11px] text-muted font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{cluster.report_count} Consented Reports</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    {cluster.cluster_name}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {cluster.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1.5">
                    Sample Indicators
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.sample_indicators.map((ind, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px]">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consented Anonymous Reporting Box */}
      <div className="bg-surface rounded-apple border border-border p-6 sm:p-8 shadow-subtle space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Contribute Anonymized Threat Intelligence</h2>
          <p className="text-xs text-muted leading-relaxed">
            Help protect fellow digital users. Submitted messages undergo strict automatic redaction (phone numbers, OTPs, UPI IDs removed) before similarity clustering.
          </p>
        </div>

        {submitSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-apple-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thank you. Your report has been anonymized and submitted for pattern cluster evaluation.</span>
          </div>
        )}

        <form onSubmit={handleReport} className="space-y-4">
          <textarea
            rows={4}
            required
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Paste suspicious text to contribute to threat intelligence..."
            className="w-full p-3.5 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent resize-none font-mono"
          />

          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="rounded border-border text-accent focus:ring-0"
            />
            <span>I give explicit consent to anonymize and cluster this message for community threat intelligence.</span>
          </label>

          <button
            type="submit"
            disabled={submitting || !consentGiven || !reportText.trim()}
            className="px-6 py-2.5 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-subtle flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Submit Consented Report</span>
          </button>
        </form>
      </div>
    </div>
  );
};
