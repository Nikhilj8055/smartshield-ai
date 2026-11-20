-- SmartShield AI - Seed Data: Known Threat Signatures & Common Pattern Clusters in India

INSERT INTO public.scam_pattern_clusters (id, cluster_name, description, pattern_signature, risk_level, report_count, status, sample_indicators)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Digital Arrest & Police Impersonation',
    'Scammers impersonate CBI, Mumbai Cyber Police, or ED via WhatsApp/Skype video calls claiming illegal parcels with narcotics or money laundering, demanding victims stay on video and transfer clearance funds.',
    'sig_digital_arrest_cbi_parcel_v1',
    'CRITICAL',
    142,
    'VERIFIED_PATTERN',
    '["digital arrest", "mumbai cyber crime", "customs narcotics", "skype interrogation", "rbi verification deposit", "do not disconnect call"]'::jsonb
),
(
    '22222222-2222-2222-2222-222222222222',
    'Urgent Electricity Bill Disconnection',
    'SMS or WhatsApp alert claiming power will be disconnected at 9:30 PM due to unpaid bill, providing a fake officer phone number or malicious APK download link.',
    'sig_electricity_bill_disconnection_v1',
    'HIGH',
    89,
    'VERIFIED_PATTERN',
    '["power will be disconnected tonight", "contact electricity officer", "update electricity bill", "download support apk"]'::jsonb
),
(
    '33333333-3333-3333-3333-333333333333',
    'Bank Account / PAN KYC Suspension Phishing',
    'SMS disguised as SBI, HDFC or ICICI stating bank account has been blocked or suspended due to pending PAN/Aadhaar KYC, directing victim to lookalike domain.',
    'sig_bank_pan_kyc_suspension_v1',
    'HIGH',
    215,
    'VERIFIED_PATTERN',
    '["your bank account blocked", "update pan card immediately", "sbi-kyc-update", "hdfc-secure-verify", "netbanking credentials"]'::jsonb
),
(
    '44444444-4444-4444-4444-444444444444',
    'Part-Time YouTube/Hotel Review Task Scam',
    'Telegram/WhatsApp recruitment offering Rs 2000-5000/day for liking YouTube videos or Google reviews, escalating into frozen prepaid crypto/recharge investment deposits.',
    'sig_part_time_task_investment_v1',
    'CRITICAL',
    310,
    'VERIFIED_PATTERN',
    '["part time job earn 3000 daily", "like youtube videos", "telegram task group", "crypto merchant withdrawal", "frozen deposit task"]'::jsonb
),
(
    '55555555-5555-5555-5555-555555555555',
    'UPI Pay-To-Receive Money / OLX QR Scam',
    'Scammer pretends to purchase an item on OLX or send a lottery/refund, sends a QR code or Collect Request claiming scanning or entering UPI PIN will receive money.',
    'sig_upi_pay_to_receive_qr_v1',
    'HIGH',
    188,
    'VERIFIED_PATTERN',
    '["scan qr to receive money", "enter upi pin to accept refund", "military buyer olx", "auto-credited to your account"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
