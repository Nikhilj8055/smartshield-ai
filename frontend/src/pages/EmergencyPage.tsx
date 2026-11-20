import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EmergencyContact } from '../types';
import { PhoneCall, ShieldAlert, AlertTriangle, Users, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';

export const EmergencyPage: React.FC = () => {
  const [statement, setStatement] = useState('');
  const [triageResult, setTriageResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Family');
  const [consentGiven, setConsentGiven] = useState(false);
  const [addingContact, setAddingContact] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await api.getEmergencyContacts();
        if (res.success && res.data) {
          setContacts(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadContacts();
  }, []);

  const handleTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;
    setLoading(true);

    try {
      const res = await api.triageEmergency(statement);
      if (res.success && res.data) {
        setTriageResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !consentGiven) return;

    try {
      const res = await api.addEmergencyContact({
        name: contactName,
        phone_number: contactPhone,
        relationship: contactRelation,
        consent_given: true,
      });

      if (res.success && res.data) {
        setContacts([...contacts, res.data]);
        setContactName('');
        setContactPhone('');
        setConsentGiven(false);
        setAddingContact(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await api.deleteEmergencyContact(id);
      if (res.success) {
        setContacts(contacts.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* High-visibility Emergency Banner */}
      <div className="p-6 sm:p-8 bg-red-600 text-white rounded-apple shadow-premium space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Threat Assistance</span>
          </div>
          <span className="text-xs bg-white text-red-600 px-3 py-1 rounded-full font-bold">24/7 National Support</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Coercion & Digital Arrest Protection
          </h1>
          <p className="text-xs sm:text-sm text-red-100 leading-relaxed max-w-xl">
            If someone claims to be police, CBI, or customs on a video call and demands secrecy or money, STOP immediately. You are being targeted.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <a
            href="tel:1930"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-red-600 font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-subtle"
          >
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span>Call 1930 Cybercrime Helpline</span>
          </a>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-red-700 text-white font-medium text-xs sm:text-sm hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
          >
            <span>Official Portal (cybercrime.gov.in)</span>
          </a>
        </div>
      </div>

      {/* Immediate Statement Triage */}
      <div className="bg-surface rounded-apple border border-border p-6 sm:p-8 shadow-subtle space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">What is the caller or sender saying?</h2>
          <p className="text-xs text-muted mt-1">
            Type what the person is claiming (e.g. "CBI parcel with illegal passport", "digital arrest", "install AnyDesk")
          </p>
        </div>

        <form onSubmit={handleTriage} className="space-y-4">
          <textarea
            rows={3}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Type what they are telling you..."
            className="w-full p-3.5 bg-background border border-border rounded-apple-sm text-xs sm:text-sm text-foreground focus:outline-none focus:border-red-400 resize-none"
          />

          <button
            type="submit"
            disabled={loading || !statement.trim()}
            className="px-6 py-2.5 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-subtle disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>Triage Coercion Signal</span>
          </button>
        </form>

        {triageResult && (
          <div className="pt-6 border-t border-border space-y-4 animate-in fade-in">
            {triageResult.isDigitalArrestDetected && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-apple-sm text-xs text-red-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>CRITICAL ALERT: DIGITAL ARREST EXTORTION DETECTED</span>
                </div>
                <p className="leading-relaxed">
                  Indian law enforcement agencies (CBI, State Police, ED, NIA) DO NOT have any concept of "Digital Arrest". They will NEVER hold court hearings or interrogations over WhatsApp, Skype, or video calls.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Immediate Safety Actions</h3>
              <div className="space-y-2">
                {triageResult.immediateActionGuide?.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-background rounded-apple-sm border border-border text-xs">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-foreground leading-relaxed font-medium">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trusted Family Contacts Section */}
      <div className="bg-surface rounded-apple border border-border p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Trusted Family & Support Contacts</h2>
            <p className="text-xs text-muted mt-0.5">
              People you can reach out to for a calm second opinion when under pressure.
            </p>
          </div>
          <button
            onClick={() => setAddingContact(!addingContact)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>

        {addingContact && (
          <form onSubmit={handleAddContact} className="p-4 bg-background rounded-apple-sm border border-border space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Register Trusted Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full Name (e.g. Son, Sister)"
                className="px-3 py-2 bg-white border border-border rounded-apple-sm text-xs text-foreground focus:outline-none"
              />
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone (+91...)"
                className="px-3 py-2 bg-white border border-border rounded-apple-sm text-xs text-foreground focus:outline-none"
              />
              <input
                type="text"
                required
                value={contactRelation}
                onChange={(e) => setContactRelation(e.target.value)}
                placeholder="Relationship"
                className="px-3 py-2 bg-white border border-border rounded-apple-sm text-xs text-foreground focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded border-border text-accent focus:ring-0"
              />
              <span>I give explicit consent to store this contact for my personal safety assistance.</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAddingContact(false)}
                className="px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!consentGiven}
                className="px-4 py-1.5 rounded-full bg-accent text-white text-xs font-medium disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {contacts.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">No trusted contacts registered yet.</p>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 bg-background rounded-apple-sm border border-border text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-accent flex items-center justify-center font-bold text-xs">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-muted text-[11px]">{c.relationship} · {c.phone_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${c.phone_number}`}
                    className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-1.5 rounded-full text-muted hover:text-red-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
