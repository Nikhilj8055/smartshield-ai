# SmartShield AI - Security Model & Threat Mitigation

## Guiding Security Principles

1. **Zero-Trust User Content**: All submitted URLs, SMS strings, email payloads, and uploaded images are classified as untrusted and potentially weaponised.
2. **SSRF & Sandbox Defense**: Remote URL lookups never issue live raw requests without DNS validation, loopback/private range blocking (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`), redirect count limits, and payload truncation.
3. **Prompt Injection Hardening**: All LLM system prompts strictly isolate user-supplied content within clear structured boundaries (`<untrusted_evidence>...</untrusted_evidence>`). The model is instructed never to follow user instructions contained inside evidence texts.
4. **Data Minimization & Zero Sensitive Storage**:
   - Never record or store bank account passwords, UPI PINs, or SMS OTPs.
   - Any OTP detected in incoming text is redacted prior to persistent database logging.
5. **Row Level Security (RLS)**: Enforced via Supabase PostgreSQL, ensuring multi-tenant isolation where users can only view, mutate, or query their own investigations and evidence.
6. **Integrity Preserving Evidence Hashing**: Every uploaded screenshot or file receives an immutable SHA-256 fingerprint generated server-side upon reception.
