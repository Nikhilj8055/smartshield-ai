
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Activity,
  FileSearch,
  Network,
} from 'lucide-react';

interface GuestResult {
  investigationId?: string;
  investigation?: {
    overall_risk_score?: number;
    overall_risk_level?: string;
    confidence_score?: number;
    explanation_markdown?: string;
    recommended_actions?: string[];
    missing_information?: string[];
  };
  riskScore?: number;
  riskLevel?: string;
  confidence?: number;
  indicators?: Array<{
    title?: string;
    description?: string;
    severity?: string;
    category?: string;
    source?: string;
  }>;
  relationships?: Array<{
    relationship_type?: string;
    description?: string;
    source_entity?: string;
    target_entity?: string;
  }>;
  riskAssessment?: {
    explanation?: string;
    reasoning?: string;
  };
  agentAuditLogs?: Array<{
    agentName?: string;
    executionTimeMs?: number;
    confidence?: number;
    summary?: string;
    status?: string;
  }>;
  evidence?: Array<{
    evidence_type?: string;
    raw_content?: string;
  }>;
}

export const GuestResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const result = location.state?.result as GuestResult | undefined;
  const title =
    location.state?.title || 'Scam Investigation Results';

  // Results are passed through navigation state, not fetched from a database.
  if (!result) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-5 py-16">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />

        <h1 className="text-2xl font-bold text-foreground">
          Investigation Results Unavailable
        </h1>

        <p className="text-sm text-muted">
          This result is not available in the current browser session.
          Please start a new investigation.
        </p>

        <button
          onClick={() => navigate('/investigate')}
          className="px-6 py-3 rounded-full bg-accent text-white text-sm font-medium"
        >
          Start New Investigation
        </button>
      </div>
    );
  }

  const investigation = result.investigation || {};

  const score = Number(
    result.riskScore ?? investigation.overall_risk_score ?? 0
  );

  const riskLevel =
    result.riskLevel ||
    investigation.overall_risk_level ||
    'UNKNOWN';

  const confidence = Number(
    result.confidence ?? investigation.confidence_score ?? 0
  );

  const indicators = result.indicators || [];
  const relationships = result.relationships || [];
  const agentLogs = result.agentAuditLogs || [];
  const recommendations = investigation.recommended_actions || [];
  const missingInformation = investigation.missing_information || [];

  const getRiskColor = (level: string) => {
    const normalized = level.toUpperCase();

    if (normalized.includes('CRITICAL') || normalized.includes('HIGH')) {
      return 'text-red-600 bg-red-50 border-red-200';
    }

    if (normalized.includes('MEDIUM') || normalized.includes('MODERATE')) {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    }

    if (normalized.includes('LOW')) {
      return 'text-green-600 bg-green-50 border-green-200';
    }

    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/investigate')}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          New Investigation
        </button>

        <span className="text-xs text-muted">
          Guest Investigation
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-accent">
          <Shield className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            SmartShield AI Analysis
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {title}
        </h1>

        <p className="text-sm text-muted">
          Multi-agent investigation results and threat assessment.
        </p>
      </div>

      {/* Risk Assessment */}
      <section className="bg-surface border border-border rounded-apple p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">
            Overall Risk Assessment
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="p-4 bg-background rounded-apple-sm border border-border">
            <p className="text-xs text-muted mb-2">Risk Score</p>
            <p className="text-3xl font-bold text-foreground">
              {score}
              <span className="text-sm text-muted"> / 100</span>
            </p>
          </div>

          <div className="p-4 bg-background rounded-apple-sm border border-border">
            <p className="text-xs text-muted mb-2">Risk Level</p>
            <span className={`inline-block px-3 py-1.5 rounded-full border text-sm font-semibold ${getRiskColor(riskLevel)}`}>
              {riskLevel}
            </span>
          </div>

          <div className="p-4 bg-background rounded-apple-sm border border-border">
            <p className="text-xs text-muted mb-2">Confidence</p>
            <p className="text-3xl font-bold text-foreground">
              {confidence > 1
                ? `${Math.round(confidence)}%`
                : `${Math.round(confidence * 100)}%`}
            </p>
          </div>

        </div>

        <div className="h-2 rounded-full bg-background overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, score))}%`,
            }}
          />
        </div>
      </section>

      {/* Explanation */}
      <section className="bg-surface border border-border rounded-apple p-6 space-y-3">
        <h2 className="font-semibold text-foreground">
          Investigation Explanation
        </h2>

        <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">
          {investigation.explanation_markdown ||
            result.riskAssessment?.explanation ||
            result.riskAssessment?.reasoning ||
            'The investigation completed, but no detailed explanation was returned.'}
        </p>
      </section>

      {/* Threat Indicators */}
      <section className="bg-surface border border-border rounded-apple p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">
            Detected Threat Indicators
          </h2>
          <span className="ml-auto text-xs text-muted">
            {indicators.length} indicators
          </span>
        </div>

        {indicators.length === 0 ? (
          <p className="text-sm text-muted">
            No threat indicators were returned. This does not necessarily
            mean the submitted evidence is safe.
          </p>
        ) : (
          <div className="space-y-3">
            {indicators.map((indicator, index) => (
              <div
                key={index}
                className="p-4 rounded-apple-sm border border-border bg-background space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {indicator.title || indicator.category || `Indicator ${index + 1}`}
                  </h3>

                  {indicator.severity && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${getRiskColor(indicator.severity)}`}>
                      {indicator.severity}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {indicator.description || 'No additional description available.'}
                </p>

                {indicator.source && (
                  <p className="text-[10px] text-muted">
                    Source: {indicator.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Relationships */}
      <section className="bg-surface border border-border rounded-apple p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">
            Evidence Relationships
          </h2>
        </div>

        {relationships.length === 0 ? (
          <p className="text-sm text-muted">
            No relationships between submitted evidence were identified.
          </p>
        ) : (
          <div className="space-y-3">
            {relationships.map((relationship, index) => (
              <div
                key={index}
                className="p-4 rounded-apple-sm bg-background border border-border"
              >
                <p className="text-xs font-semibold text-foreground">
                  {relationship.relationship_type || 'Evidence relationship'}
                </p>

                {(relationship.source_entity || relationship.target_entity) && (
                  <p className="text-xs text-muted mt-1">
                    {relationship.source_entity || 'Unknown'} → {relationship.target_entity || 'Unknown'}
                  </p>
                )}

                {relationship.description && (
                  <p className="text-xs text-muted mt-2">
                    {relationship.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Agent Execution */}
      <section className="bg-surface border border-border rounded-apple p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">
            Specialist Agent Execution
          </h2>
          <span className="ml-auto text-xs text-muted">
            {agentLogs.length} logs
          </span>
        </div>

        {agentLogs.length === 0 ? (
          <p className="text-sm text-muted">
            No agent execution logs were returned.
          </p>
        ) : (
          <div className="space-y-3">
            {agentLogs.map((agent, index) => (
              <div
                key={index}
                className="p-4 bg-background rounded-apple-sm border border-border"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {agent.agentName || `Agent ${index + 1}`}
                  </p>

                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>

                {agent.summary && (
                  <p className="text-xs text-muted mt-2">
                    {agent.summary}
                  </p>
                )}

                {typeof agent.executionTimeMs === 'number' && (
                  <p className="text-[10px] text-muted mt-2">
                    Execution time: {agent.executionTimeMs} ms
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recommendations */}
      <section className="bg-surface border border-border rounded-apple p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-foreground">
            Recommended Safety Actions
          </h2>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-sm text-muted">
            Follow general digital safety practices and verify suspicious
            requests through official channels.
          </p>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((action, index) => (
              <li key={index} className="flex gap-3 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Missing Information */}
      {missingInformation.length > 0 && (
        <section className="bg-surface border border-border rounded-apple p-6 space-y-3">
          <h2 className="font-semibold text-foreground">
            Additional Information Needed
          </h2>

          <ul className="space-y-2">
            {missingInformation.map((item, index) => (
              <li key={index} className="text-sm text-muted">
                • {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* New Investigation */}
      <button
        onClick={() => navigate('/investigate')}
        className="w-full py-3.5 rounded-full bg-accent text-white font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Start Another Investigation
      </button>

      <p className="text-center text-[10px] text-muted">
        AI-generated assessment. Verify critical findings independently.
        No investigation history is saved in this guest session.
      </p>

    </div>
  );
};
