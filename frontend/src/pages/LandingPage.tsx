import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  MessageSquare,
  Globe,
  Camera,
  CreditCard,
  Network,
  LifeBuoy,
  PhoneCall,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-subtle border border-accent/20 text-accent text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Multi-Channel Scam Investigation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
          Understand the Threat.<br />
          <span className="text-accent">Protect Your Next Move.</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted font-normal leading-relaxed max-w-2xl mx-auto">
          An intelligent scam investigation platform that connects suspicious messages, links, screenshots and payment signals to help you make safer digital decisions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/investigate"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-accent text-white font-medium hover:bg-accent-hover transition-all shadow-premium flex items-center justify-center gap-2 text-sm"
          >
            <span>Start Investigation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/emergency"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-surface border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Emergency Protection & 1930</span>
          </Link>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Six Essential Capabilities
          </h2>
          <p className="text-sm text-muted max-w-lg mx-auto">
            From deceptive WhatsApp notifications to suspicious UPI requests, SmartShield isolates threat vectors with deterministic precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-apple-sm bg-blue-50 text-accent flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">1. Suspicious Message Analysis</h3>
            <p className="text-xs text-muted leading-relaxed">
              Detects fake bank KYC, electricity cutoff alerts, job scams, and emotional intimidation across SMS, WhatsApp, and email.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-apple-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">2. Fraudulent URL Detection</h3>
            <p className="text-xs text-muted leading-relaxed">
              Domain normalisation, Punycode analysis, brand lookalike verification, and integration with Safe Browsing and URLhaus.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-apple-sm bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">3. Screenshot OCR Inspection</h3>
            <p className="text-xs text-muted leading-relaxed">
              Extracts text and payment identifiers from visual chat captures, separating raw text evidence from analytical findings.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-apple-sm bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">4. Evidence-Based Risk Scoring</h3>
            <p className="text-xs text-muted leading-relaxed">
              Mathematical scoring formula with deduplicated indicators, severity weighting, and no generative hallucination.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-apple-sm bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">5. Explainable Threat Indicators</h3>
            <p className="text-xs text-muted leading-relaxed">
              Clear "Why was this flagged?" explanations written in plain, accessible language for Indian digital users.
            </p>
          </div>

          <div className="p-6 bg-surface rounded-apple border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-apple-sm bg-rose-50 text-rose-600 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">6. Actionable Safety Guidance</h3>
            <p className="text-xs text-muted leading-relaxed">
              Step-by-step checklists, golden hour account freezing guides, and direct linkage to Indian cybercrime helpline 1930.
            </p>
          </div>
        </div>
      </section>

      {/* Advanced Capabilities */}
      <section className="bg-surface rounded-apple border border-border p-8 sm:p-12 shadow-premium space-y-10">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Core Differentiators</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Five Advanced Protection Modules
          </h2>
          <p className="text-sm text-muted mt-2">
            One unified investigation engine powering five specialized defense layers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-apple-sm bg-blue-50 text-accent flex items-center justify-center shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground">Scam Journey Intelligence</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Connects multiple evidence items (SMS + URL + UPI VPA) into an interactive relationship graph, uncovering discrepancy patterns across channels.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-apple-sm bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground">Before-You-Pay Protection</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                UPI syntax verification, QR code payload decoding, and detection of pay-to-receive scams before you authorize a transaction.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-apple-sm bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground">Coercion & Emergency Protection</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Immediate triage for "Digital Arrest" threats, fake police/CBI video calls, remote access software alerts, and trusted family contact setup.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-apple-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground">Scam Recovery Command Centre</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Structured post-incident management: Indian cybercrime portal (1930) filing instructions, bank escalation templates, and timeline tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Zero-Trust Notice */}
      <section className="p-8 rounded-apple border border-border bg-white text-center max-w-2xl mx-auto space-y-3">
        <Lock className="w-6 h-6 text-accent mx-auto" />
        <h3 className="text-base font-semibold text-foreground">Zero Sensitive Data Storage</h3>
        <p className="text-xs text-muted leading-relaxed">
          SmartShield AI never stores or requests bank passwords, OTPs, or UPI PINs. Anonymized reports require explicit consent, and private investigations remain isolated under Row Level Security.
        </p>
      </section>
    </div>
  );
};
