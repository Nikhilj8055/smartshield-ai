import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Investigation } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import { RiskBadge } from '../components/RiskBadge';
import { EntityGraph } from '../components/EntityGraph';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Loader2,
  ArrowLeft,
  LifeBuoy,
} from 'lucide-react';

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'MESSAGE' | 'URL' | 'UPI'>('URL');

  useEffect(() => {
    async function fetchInv() {
      if (!id) return;
      try {
        const res = await api.getInvestigation(id);
        if (res.success && res.data) {
          setInvestigation(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInv();
  }, [id]);

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newContent.trim()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('type', newType);
      formData.append('content', newContent);

      const res = await api.addEvidence(id, formData);
      if (res.success && res.data) {
        setInvestigation(res.data);
        setNewContent('');
        setAddingEvidence(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
        <p className="text-xs text-muted">Loading complete investigation dossier...</p>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="py-24 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-muted mx-auto" />
        <h2 className="text-base font-semibold text-foreground">Investigation Dossier Not Found</h2>
        <Link to="/dashboard" className="text-xs text-accent hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {investigation.title}
            </h1>
            <RiskBadge level={investigation.overall_risk_level} />
          </div>
        </div>

        <button
          onClick={() => setAddingEvidence(!addingEvidence)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface text-foreground hover:bg-gray-50 text-xs font-medium shadow-subtle transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Correlating Evidence</span>
        </button>
      </div>

      {/* Add Evidence Drawer */}
      {addingEvidence && (
        <form
          onSubmit={handleAddEvidence}
          className="p-5 bg-surface rounded-apple border border-accent/40 shadow-subtle space-y-4 animate-in fade-in"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
            Append Cross-Channel Evidence to Scam Journey
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="px-3 py-2 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none"
            >
              <option value="MESSAGE">Related SMS / Chat Message</option>
              <option value="URL">Associated Website / Link</option>
              <option value="UPI">Requested UPI VPA</option>
            </select>
            <input
              type="text"
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Paste content to connect..."
              className="sm:col-span-2 px-3 py-2 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddingEvidence(false)}
              className="px-3 py-1.5 text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full bg-accent text-white text-xs font-medium hover:bg-accent-hover"
            >
              Correlate
            </button>
          </div>
        </form>
      )}

      {/* Top Section: Risk Gauge & Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RiskGauge
          score={investigation.overall_risk_score}
          level={investigation.overall_risk_level}
          confidence={investigation.confidence_score}
        />

        <div className="md:col-span-2 p-6 bg-surface rounded-apple border border-border shadow-subtle flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Executive Threat Assessment
            </h3>
            <p className="text-sm text-foreground leading-relaxed font-normal whitespace-pre-line">
              {investigation.explanation_markdown || 'No explanation provided.'}
            </p>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>Deterministic Scoring v1.2</span>
            <span>Recorded: {new Date(investigation.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations Checklist ("What should I do now?") */}
      <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <h3 className="text-base font-semibold text-foreground">What Should I Do Now?</h3>
        </div>

        <div className="space-y-2.5">
          {investigation.recommended_actions?.map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-background rounded-apple-sm border border-border text-xs"
            >
              <span className="w-5 h-5 rounded-full bg-accent-subtle text-accent flex items-center justify-center font-semibold text-[11px] shrink-0">
                {idx + 1}
              </span>
              <p className="text-foreground leading-relaxed pt-0.5">{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scam Journey Intelligence Graph */}
      <EntityGraph relationships={investigation.relationships || []} />

      {/* Threat Indicators List ("Why was this flagged?") */}
      <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <h3 className="text-base font-semibold text-foreground">Why Was This Flagged? (Threat Indicators)</h3>
          </div>
          <span className="text-xs text-muted">{investigation.indicators?.length || 0} indicators</span>
        </div>

        <div className="space-y-3">
          {investigation.indicators?.map((ind) => (
            <div
              key={ind.id}
              className="p-4 bg-background rounded-apple-sm border border-border space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{ind.indicator_type}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {ind.category} · {ind.severity}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{ind.explanation}</p>
              <div className="text-[10px] text-muted flex items-center gap-3 pt-1">
                <span>Source: {ind.source}</span>
                <span>Confidence: {ind.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Drawer */}
      <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted" />
          <h3 className="text-base font-semibold text-foreground">Submitted Evidence Sources</h3>
        </div>

        <div className="space-y-3">
          {investigation.evidence?.map((ev) => (
            <div
              key={ev.id}
              className="p-4 bg-background rounded-apple-sm border border-border space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{ev.evidence_type} Evidence</span>
                <span className="text-muted text-[11px]">Reliability: {ev.reliability_score * 100}%</span>
              </div>
              {ev.raw_content && (
                <div className="p-3 bg-white rounded border border-border font-mono text-[11px] text-foreground leading-relaxed break-all">
                  {ev.raw_content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
