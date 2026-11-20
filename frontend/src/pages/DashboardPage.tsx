import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Investigation } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { Shield, Plus, ArrowRight, AlertTriangle, CreditCard, LifeBuoy, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.listInvestigations();
        if (res.success && res.data) {
          setInvestigations(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Active Threat Investigation & Scam Risk Management
          </p>
        </div>

        <Link
          to="/investigate"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white font-medium hover:bg-accent-hover transition-colors shadow-subtle text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </Link>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/investigate"
          className="p-5 bg-surface rounded-apple border border-border shadow-subtle hover:border-accent transition-all group"
        >
          <div className="w-9 h-9 rounded-apple-sm bg-blue-50 text-accent flex items-center justify-center mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
            Analyze Evidence
          </h3>
          <p className="text-xs text-muted mt-1">Submit SMS, WhatsApp text, URL, or screenshot</p>
        </Link>

        <Link
          to="/before-you-pay"
          className="p-5 bg-surface rounded-apple border border-border shadow-subtle hover:border-purple-400 transition-all group"
        >
          <div className="w-9 h-9 rounded-apple-sm bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-purple-600 transition-colors">
            Before-You-Pay
          </h3>
          <p className="text-xs text-muted mt-1">Verify UPI ID or QR code before transferring money</p>
        </Link>

        <Link
          to="/emergency"
          className="p-5 bg-surface rounded-apple border border-border shadow-subtle hover:border-red-300 transition-all group"
        >
          <div className="w-9 h-9 rounded-apple-sm bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-red-600 transition-colors">
            Emergency Coercion
          </h3>
          <p className="text-xs text-muted mt-1">Digital arrest triage & family safety checklist</p>
        </Link>

        <Link
          to="/recovery"
          className="p-5 bg-surface rounded-apple border border-border shadow-subtle hover:border-emerald-400 transition-all group"
        >
          <div className="w-9 h-9 rounded-apple-sm bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
            Recovery Centre
          </h3>
          <p className="text-xs text-muted mt-1">File 1930 Cybercrime case & bank escalation</p>
        </Link>
      </div>

      {/* Recent Investigations List */}
      <div className="bg-surface rounded-apple border border-border p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            <h2 className="text-base font-semibold text-foreground">Recent Investigations</h2>
          </div>
          <span className="text-xs text-muted">{investigations.length} recorded</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading investigations...</div>
        ) : investigations.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-muted">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No investigations yet</p>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Paste an SMS, suspicious job offer, or payment QR code to initiate your first safety analysis.
              </p>
            </div>
            <Link
              to="/investigate"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start Investigation</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {investigations.map((inv) => (
              <Link
                key={inv.id}
                to={`/investigation/${inv.id}`}
                className="flex items-center justify-between py-4 hover:bg-black/[0.02] -mx-4 px-4 rounded-apple-sm transition-colors group"
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                      {inv.title}
                    </span>
                    <RiskBadge level={inv.overall_risk_level} size="sm" />
                  </div>
                  <p className="text-xs text-muted truncate max-w-md">
                    {inv.explanation_markdown ? inv.explanation_markdown.split('\n')[0].replace('###', '').trim() : 'Investigation completed'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-foreground">
                    {inv.overall_risk_score}/100
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
