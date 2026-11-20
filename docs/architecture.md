# SmartShield AI - Architectural Specification

## System Overview

SmartShield AI is an intelligent multi-channel scam investigation and risk explanation platform tailored for Indian digital payment users, elderly individuals, and mobile smartphone users. It processes multi-modal inputs (SMS, WhatsApp, emails, screenshots, QR codes, UPI IDs, and domain URLs) through a coordinated pipeline of six specialist agents governed by a Central Orchestrator and a deterministic, auditable Risk Calculation Engine.

```
                    ┌────────────────────────┐
                    │    Frontend Client     │
                    │ (React / TS / Tailwind)│
                    └───────────┬────────────┘
                                │ HTTPS / REST v1
                                ▼
                    ┌────────────────────────┐
                    │ Express API Gateway &  │
                    │ Security / Auth Layer  │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┴────────────────────────┐
        ▼                                                ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│     Central Orchestrator      │        │    Scam Journey & Clusters    │
└───────┬───────────────────────┘        └───────────────────────────────┘
        │ Dispatches & Aggregates
 ┌──────┴──────┬──────────┬──────────┬──────────┬──────────┐
 │             │          │          │          │          │
 ▼             ▼          ▼          ▼          ▼          ▼
[Message]    [URL]    [Screen]   [Payment]  [Context]  [Safety]
Agent        Agent     Agent      Agent      Agent      Agent
 │             │          │          │          │          │
 └──────┬──────┴──────────┴──────────┴──────────┴──────────┘
        ▼
┌───────────────────────────────┐
│  Deterministic Risk Engine    │ (Auditable weighted factor calculator)
└──────────────┬────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
 [Supabase / DB]  [Storage]
```

## Core Components

### 1. Central Multi-Agent Orchestrator
- Coordinates evaluation across evidence items.
- Delegates payload processing to specialist domain agents.
- Ensures structured JSON message passing with confidence scores and source attribution.
- Enforces prompt injection mitigation and deterministic fallbacks.

### 2. Specialist Domain Agents
- **Message Analysis Agent**: Examines psychological coercion, fake KYC, urgency cues, impersonation, and extracts structured entities (amounts, dates, contact vectors, UPI IDs).
- **URL Intelligence Agent**: Safe domain normalisation, Punycode detection, typosquatting/lookalike assessment, IP address URL detection, threat intelligence feeds (Google Safe Browsing, URLhaus adapters).
- **Screenshot Analysis Agent**: OCR text extraction, coordinate detection, entity extraction from visual receipts/chats, separating raw OCR text from interpretive inferences.
- **Payment Investigation Agent**: UPI identifier syntax validation, known VPA reputation checks, QR code payload decoding (via ZXing parser), payment intent consistency checking (e.g., pay-to-receive scams).
- **Context Correlation Agent**: Connects disparate evidence into a visual graph of entities (phone numbers, UPI IDs, domains, organisation claims) and computes relational indicators.
- **Safety Advisory Agent**: Generates tailored, non-technical recovery steps, official Indian cybercrime reporting guides (1930 / cybercrime.gov.in), and emergency checklists.

### 3. Deterministic Risk Engine
- Independent mathematical scoring service (0-100 scale; LOW, MEDIUM, HIGH, CRITICAL, INSUFFICIENT EVIDENCE).
- Deduplicates correlated indicators to avoid artificial risk inflation.
- Incorporates source reliability and evidence confidence weighting.
