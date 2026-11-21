
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Globe,
  Camera,
  CreditCard,
  Shield,
  Loader2,
  ArrowRight,
} from 'lucide-react';

import { api } from '../services/api';

type EvidenceTab = 'MESSAGE' | 'URL' | 'SCREENSHOT' | 'UPI';

export const InvestigationWorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<EvidenceTab>('MESSAGE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: EvidenceTab) => {
    setActiveTab(tab);
    setContent('');
    setFile(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // Validate input before creating an investigation.
      if (activeTab === 'SCREENSHOT' && !file) {
        setError('Please upload a screenshot image.');
        return;
      }

      if (activeTab !== 'SCREENSHOT' && !content.trim()) {
        setError('Please provide the evidence to investigate.');
        return;
      }

      if (activeTab === 'URL') {
        let parsedUrl: URL;

        try {
          parsedUrl = new URL(content.trim());
        } catch {
          setError('Please enter a valid complete URL, including https:// or http://.');
          return;
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          setError('Only HTTP and HTTPS URLs are supported.');
          return;
        }
      }

      // Create the investigation with its initial evidence.
      // The backend orchestrator dispatches the appropriate specialist agent.
      const investigationTitle =
        title.trim() || `${activeTab} Scam Investigation`;

      const initialContent =
        activeTab === 'SCREENSHOT'
          ? undefined
          : content.trim();

      const invRes = await api.createInvestigation(
        investigationTitle,
        activeTab,
        initialContent
      );

      if (!invRes?.success || !invRes?.data?.id) {
        throw new Error(
          invRes?.error || 'Failed to create investigation.'
        );
      }

      const investigationId = invRes.data.id;

      // Screenshots are attached after the investigation is created.
      if (activeTab === 'SCREENSHOT' && file) {
        const formData = new FormData();

        formData.append('file', file);
        formData.append('type', 'SCREENSHOT');

        if (content.trim()) {
          formData.append('content', content.trim());
        }

        const evidenceRes = await api.addEvidence(
          investigationId,
          formData
        );

        if (!evidenceRes?.success) {
          throw new Error(
            evidenceRes?.error || 'Screenshot upload failed.'
          );
        }
      }

      // Open the saved investigation dossier.
      navigate(`/investigation/${investigationId}`);

    } catch (err: unknown) {
      console.error('Investigation submission failed:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during investigation.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Start Scam Investigation
        </h1>

        <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto">
          Submit suspicious messages, lookalike links, chat screenshots,
          or UPI requests for multi-agent evaluation.
        </p>
      </div>

      <div className="bg-surface rounded-apple border border-border p-6 sm:p-8 shadow-subtle space-y-6">

        {/* Evidence Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-background rounded-apple-sm border border-border">

          <button
            type="button"
            onClick={() => handleTabChange('MESSAGE')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'MESSAGE'
                ? 'bg-surface text-foreground shadow-xs border border-border'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message / SMS</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('URL')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'URL'
                ? 'bg-surface text-foreground shadow-xs border border-border'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Link / URL</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('SCREENSHOT')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'SCREENSHOT'
                ? 'bg-surface text-foreground shadow-xs border border-border'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Screenshot</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('UPI')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'UPI'
                ? 'bg-surface text-foreground shadow-xs border border-border'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>UPI / Payment</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-apple-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Investigation Title */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              Investigation Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Suspicious SBI KYC SMS or OLX Buyer QR"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Message */}
          {activeTab === 'MESSAGE' && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Suspicious Message Content
              </label>

              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste full SMS, WhatsApp message, Telegram recruitment text, or email body..."
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-sm text-foreground focus:outline-none focus:border-accent resize-none font-mono text-xs leading-relaxed"
              />
            </div>
          )}

          {/* URL */}
          {activeTab === 'URL' && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                Website or Link Address
              </label>

              <input
                type="url"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://sbi-kyc-update.example.com/verify"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-sm text-foreground focus:outline-none focus:border-accent font-mono text-xs"
              />
            </div>
          )}

          {/* Screenshot */}
          {activeTab === 'SCREENSHOT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Upload Screenshot Image
                </label>

                <input
                  type="file"
                  required
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent-subtle file:text-accent hover:file:bg-accent/20 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Optional Notes or Observed Text
                </label>

                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Add context or manually transcribed text from the image..."
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-sm text-foreground focus:outline-none focus:border-accent resize-none text-xs"
                />
              </div>
            </div>
          )}

          {/* UPI */}
          {activeTab === 'UPI' && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                UPI ID or Payment Details
              </label>

              <input
                type="text"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="recipient@okhdfcbank or merchant@ybl"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-sm text-foreground focus:outline-none focus:border-accent font-mono text-xs"
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-accent text-white font-medium hover:bg-accent-hover transition-colors shadow-subtle flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Investigation Agents...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Execute Multi-Agent Investigation</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
