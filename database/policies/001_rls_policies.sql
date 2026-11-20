-- SmartShield AI - Row Level Security Policies (001_rls_policies.sql)
-- Strict isolation ensuring users only access their own investigations and evidence

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scam_pattern_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policy
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Investigations Policy
CREATE POLICY "Users can view own investigations" ON public.investigations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own investigations" ON public.investigations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investigations" ON public.investigations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investigations" ON public.investigations
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Evidence Policy
CREATE POLICY "Users can view own evidence" ON public.evidence
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence" ON public.evidence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own evidence" ON public.evidence
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Threat Indicators & Relationships Policy
CREATE POLICY "Users can view threat indicators of own investigations" ON public.threat_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.investigations i
            WHERE i.id = threat_indicators.investigation_id AND i.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view relationships of own investigations" ON public.investigation_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.investigations i
            WHERE i.id = investigation_relationships.investigation_id AND i.user_id = auth.uid()
        )
    );

-- 5. Emergency Contacts Policy
CREATE POLICY "Users can manage own emergency contacts" ON public.emergency_contacts
    FOR ALL USING (auth.uid() = user_id);

-- 6. Recovery Cases Policy
CREATE POLICY "Users can manage own recovery cases" ON public.recovery_cases
    FOR ALL USING (auth.uid() = user_id);

-- 7. Scam Reports & Clusters
-- Consented anonymized reports are readable if user authored them; verified clusters are readable to all authenticated users
CREATE POLICY "Users can view own scam reports" ON public.scam_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert consented scam reports" ON public.scam_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read verified pattern clusters" ON public.scam_pattern_clusters
    FOR SELECT USING (auth.role() = 'authenticated');
