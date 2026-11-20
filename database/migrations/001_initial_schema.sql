-- SmartShield AI - Complete Database Schema Migration (001_initial_schema.sql)
-- Supabase PostgreSQL with RLS and Foreign Key Constraints

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'auditor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. INVESTIGATIONS
CREATE TABLE IF NOT EXISTS public.investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')),
    overall_risk_level TEXT NOT NULL DEFAULT 'INSUFFICIENT EVIDENCE' CHECK (overall_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INSUFFICIENT EVIDENCE')),
    overall_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
    confidence_score INTEGER NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    explanation_markdown TEXT,
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    missing_information JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EVIDENCE ITEMS
CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('MESSAGE', 'URL', 'SCREENSHOT', 'UPI', 'QR', 'SENDER_ID', 'OTHER')),
    raw_content TEXT,
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    file_path TEXT,
    file_hash TEXT,
    mime_type TEXT,
    reliability_score NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (reliability_score >= 0.00 AND reliability_score <= 1.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. THREAT INDICATORS
CREATE TABLE IF NOT EXISTS public.threat_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
    indicator_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('COERCION', 'URGENCY', 'FINANCIAL', 'IMPERSONATION', 'MALICIOUS_LINK', 'CREDENTIAL_HARVESTING', 'IDENTITY_DECEPTION', 'REMOTE_ACCESS')),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    explanation TEXT NOT NULL,
    raw_matched_pattern TEXT,
    verification_status TEXT NOT NULL DEFAULT 'AUTOMATED_MATCH' CHECK (verification_status IN ('AUTOMATED_MATCH', 'INTELLIGENCE_CONFIRMED', 'USER_REPORTED', 'DISMISSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INVESTIGATION RELATIONSHIPS (FOR SCAM JOURNEY INTELLIGENCE GRAPH)
CREATE TABLE IF NOT EXISTS public.investigation_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    source_entity_id TEXT NOT NULL,
    source_entity_type TEXT NOT NULL,
    source_label TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_label TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    confidence INTEGER NOT NULL DEFAULT 85 CHECK (confidence >= 0 AND confidence <= 100),
    evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RISK ASSESSMENTS (AUDITABLE HISTORICAL SCORING)
CREATE TABLE IF NOT EXISTS public.risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    calculation_version TEXT NOT NULL DEFAULT '1.0.0',
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INSUFFICIENT EVIDENCE')),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AGENT RUN AUDITS
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'TIMED_OUT')),
    execution_time_ms INTEGER NOT NULL DEFAULT 0,
    input_summary TEXT,
    findings JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PAYMENT INVESTIGATIONS (BEFORE-YOU-PAY PROTECTION)
CREATE TABLE IF NOT EXISTS public.payment_investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID REFERENCES public.investigations(id) ON DELETE CASCADE,
    upi_id TEXT,
    recipient_name TEXT,
    qr_payload TEXT,
    amount NUMERIC(12, 2),
    payment_purpose TEXT,
    risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INSUFFICIENT EVIDENCE')),
    risk_score INTEGER NOT NULL DEFAULT 0,
    suspicious_patterns JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. EMERGENCY CONTACTS (COERCION & FAMILY SAFETY)
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    relationship TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. RECOVERY CASES (SCAM RECOVERY COMMAND CENTRE)
CREATE TABLE IF NOT EXISTS public.recovery_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    investigation_id UUID REFERENCES public.investigations(id) ON DELETE SET NULL,
    case_number TEXT UNIQUE NOT NULL,
    incident_date DATE NOT NULL,
    amount_lost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    transaction_reference TEXT,
    bank_name TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'EVIDENCE_COLLECTED', 'BANK_CONTACTED', 'REPORTED', 'FOLLOW_UP_REQUIRED', 'CLOSED')),
    official_complaint_id TEXT,
    notes TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SCAM REPORTS & PATTERN CLUSTERS (EMERGING SCAM DISCOVERY)
CREATE TABLE IF NOT EXISTS public.scam_pattern_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_name TEXT NOT NULL,
    description TEXT NOT NULL,
    pattern_signature TEXT UNIQUE NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    report_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'VERIFIED_PATTERN', 'DISMISSED')),
    sample_indicators JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scam_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cluster_id UUID REFERENCES public.scam_pattern_clusters(id) ON DELETE SET NULL,
    anonymized_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    extracted_indicators JSONB DEFAULT '[]'::jsonb,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    verification_status TEXT NOT NULL DEFAULT 'NEW' CHECK (verification_status IN ('NEW', 'UNDER_REVIEW', 'VERIFIED_PATTERN', 'DISMISSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_investigations_user ON public.investigations(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_investigation ON public.evidence(investigation_id);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_investigation ON public.threat_indicators(investigation_id);
CREATE INDEX IF NOT EXISTS idx_investigation_relationships_inv ON public.investigation_relationships(investigation_id);
CREATE INDEX IF NOT EXISTS idx_recovery_cases_user ON public.recovery_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_scam_reports_cluster ON public.scam_reports(cluster_id);
