
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Globe,
  Camera,
  Shield,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';

import { api } from '../services/api';

export const InvestigationWorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    const cleanMessage = message.trim();
    const cleanUrl = url.trim();

    // At least one evidence source is required.
    if (!cleanMessage && !cleanUrl && !file) {
      setError(
        'Please provide at least one evidence source: message, URL or screenshot.'
      );
      return;
    }

    // Validate URL.
    if (cleanUrl) {
      try {
        const parsedUrl = new URL(cleanUrl);

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          setError('Only HTTP and HTTPS URLs are supported.');
          return;
        }
      } catch {
        setError(
          'Please enter a valid complete URL, including https:// or http://.'
        );
        return;
      }
    }

    // Validate screenshot type.
    if (file) {
      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/webp',
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('Only PNG, JPEG and WebP images are supported.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Screenshot size must be less than 10 MB.');
        return;
      }
    }

    setLoading(true);

    try {
      // Prepare one request containing all available evidence.
      const formData = new FormData();

      if (cleanMessage) {
        formData.append('message', cleanMessage);
      }

      if (cleanUrl) {
        formData.append('url', cleanUrl);
      }

      if (file) {
        formData.append('file', file);
      }

      // Direct guest investigation.
      // No login, database investigation creation or saved evidence required.
      const response = await api.guestInvestigate(formData);

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message ||
          response?.error ||
          'Investigation could not be completed.'
        );
      }

      // Open the guest results page with the returned investigation.
      navigate('/guest-results', {
        state: {
          result: response.data,
          title: title.trim() || 'Scam Investigation',
        },
      });

    } catch (err: unknown) {
      console.error('Guest investigation failed:', err);

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

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Start Scam Investigation
        </h1>

        <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto">
          Submit suspicious messages, lookalike links and chat screenshots
          together for multi-agent investigation and cross-channel analysis.
        </p>
      </div>

      {/* Investigation Workspace */}
      <div className="bg-surface rounded-apple border border-border p-6 sm:p-8 shadow-subtle space-y-6">

        {/* Evidence Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="flex items-center gap-3 p-3 rounded-apple-sm bg-background border border-border">
            <MessageSquare className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                Message Analysis
              </p>
              <p className="text-[10px] text-muted">
                SMS, WhatsApp, Email
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-apple-sm bg-background border border-border">
            <Globe className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                URL Analysis
              </p>
              <p className="text-[10px] text-muted">
                Suspicious websites
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-apple-sm bg-background border border-border">
            <Camera className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                Screenshot Analysis
              </p>
              <p className="text-[10px] text-muted">
                Images and conversations
              </p>
            </div>
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start justify-between gap-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-apple-sm">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

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
              maxLength={150}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Message Evidence */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-accent" />
              Suspicious Message
              <span className="text-muted font-normal normal-case tracking-normal">
                (Optional)
              </span>
            </label>

            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={10000}
              placeholder="Paste suspicious SMS, WhatsApp messages, Telegram recruitment messages or email content..."
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-sm text-foreground focus:outline-none focus:border-accent resize-none font-mono text-xs leading-relaxed"
            />
          </div>

          {/* URL Evidence */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
              <Globe className="w-4 h-4 text-accent" />
              Suspicious URL
              <span className="text-muted font-normal normal-case tracking-normal">
                (Optional)
              </span>
            </label>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/verify"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-sm text-foreground focus:outline-none focus:border-accent font-mono text-xs"
            />
          </div>

          {/* Screenshot Evidence */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
              <Camera className="w-4 h-4 text-accent" />
              Screenshot Evidence
              <span className="text-muted font-normal normal-case tracking-normal">
                (Optional)
              </span>
            </label>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent-subtle file:text-accent hover:file:bg-accent/20 cursor-pointer"
            />

            {file && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-apple-sm bg-background border border-border">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-muted hover:text-red-500"
                  aria-label="Remove screenshot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Information */}
          <div className="p-3 bg-background border border-border rounded-apple-sm">
            <p className="text-[11px] text-muted leading-relaxed">
              <strong className="text-foreground">Investigation tip:</strong>{' '}
              Submit multiple evidence sources together whenever possible.
              SmartShield AI can then examine the submitted evidence collectively
              and identify relationships between suspicious signals.
            </p>
          </div>

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
