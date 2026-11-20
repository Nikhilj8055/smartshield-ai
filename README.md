# SmartShield AI

> **Multi-Channel Scam Detection & Risk Explanation Engine**
> Tailored for Indian Digital Payment Users, Elderly Individuals, and Mobile Consumers.

---

## 🛡️ Product Overview

**SmartShield AI** is an intelligent cybersecurity platform designed to protect users against multi-channel scams (SMS, WhatsApp, lookalike links, chat screenshots, and UPI payment requests). It unites six specialist agents under a Central Orchestrator and an auditable, deterministic Risk Scoring Engine to identify deceptive tactics, correlate cross-channel evidence, explain threat indicators, and provide immediate safety and recovery guidance.

### Target Audiences & Use Cases
- **Indian Smartphone Users & Families**: Protection against fake SBI/HDFC KYC alerts, electricity disconnection scams, and lottery fraud.
- **Elderly Citizens**: Immediate high-contrast emergency guidance against **"Digital Arrest"** and fake law-enforcement extortion.
- **First-Time UPI Users**: **Before-You-Pay Protection** verifying VPA syntax, QR codes, and debunking "pay-to-receive" scams.
- **Victims of Financial Fraud**: Guided incident response with one-tap access to the **National Cybercrime Helpline (1930)** and **cybercrime.gov.in** filing instructions.

---

## 🚀 Key Capabilities

### 1. Core Investigation Engine
- **Suspicious Message Analysis**: Detects coercion, urgency, intimidation, fake bank alerts, remote-access application prompts, and harvests structured entities.
- **Fraudulent URL Threat Detection**: Safe domain parsing, Punycode/IDN detection, brand lookalike typosquatting identification, URL shortener resolution, and threat intelligence adapters.
- **Screenshot OCR Analysis**: Processes image captures, extracts visible text and identifiers, and isolates optical recognition data from interpretive findings.
- **Deterministic Risk Calculation**: A mathematically grounded, multi-factor scoring model ($0-100$ scale: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `INSUFFICIENT EVIDENCE`). Eliminates AI hallucination of arbitrary probabilities.
- **Explainable Threat Indicators**: Plain-language explanations detailing *"Why was this flagged?"* and prioritized *"What should I do now?"* checklists.

### 2. Advanced Protection Modules
1. **Scam Journey Intelligence**: Connects isolated messages, URLs, phone numbers, and UPI VPAs into an interactive entity relationship graph.
2. **Before-You-Pay Protection**: Evaluates UPI VPAs and QR codes, reinforcing that entering a UPI PIN **always** deducts money from an account.
3. **Coercion & Emergency Protection**: Instant triage for "Digital Arrest" threats, remote-access isolation instructions, and trusted family contact setup with explicit consent.
4. **Emerging Scam Discovery**: Consented, privacy-filtered anonymous reporting clustering emerging threats against verified signatures.
5. **Scam Recovery Command Centre**: A 6-stage incident recovery pipeline for frozen account escalation and official FIR documentation.

---

## 🏛️ System Architecture

```
                       ┌────────────────────────┐
                       │     React Frontend     │
                       │   (Tailwind / Apple UI)│
                       └───────────┬────────────┘
                                   │ REST v1
                                   ▼
                       ┌────────────────────────┐
                       │ Express API & Security │
                       └───────────┬────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       ┌────────────────────────┐    ┌────────────────────────┐
       │  Central Orchestrator  │    │ Scam Journey & Clusters│
       └────────────┬───────────┘    └────────────────────────┘
                    │ Dispatches
      ┌──────┬──────┴─────┬──────┬──────┐
      ▼      ▼            ▼      ▼      ▼
    [Msg]  [URL]       [Screen] [Pay] [Context]
    Agent  Agent        Agent   Agent  Agent
      │      │            │      │      │
      └──────┴──────┬─────┴──────┴──────┘
                    ▼
       ┌────────────────────────┐
       │   Deterministic Risk   │  (Anti-Hallucination,
       │      Calculator        │   Auditable Formula)
       └────────────┬───────────┘
                    ▼
       ┌────────────────────────┐
       │  Supabase / PostgreSQL │
       │  (RLS Data Isolation)  │
       └────────────────────────┘
```

---

## 💻 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Apple Minimal Design System), Lucide React, React Router v7, TanStack Query.
- **Backend**: Node.js, Express, TypeScript, Helmet, CORS, Express-Rate-Limit, Zod, Multer, Bcrypt, JSON Web Tokens.
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies and migrations. Includes offline in-memory/JSON store fallback for local development.
- **Intelligence & Parsing**: SafeBrowsingAdapter, UrlhausAdapter, NPCI UPI handle registry, Punycode decoder, regex entity extractors.

---

## ⚡ Quick Start & Execution

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Installation
Install dependencies across both backend and frontend:
```bash
npm run install:all
```

### 2. Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run the Backend Test Suite
Verify all 10 threat detection scenarios (bank notices, fake KYC, digital arrest, job scams, lookalikes, UPI fraud):
```bash
npm test --prefix backend
```

### 4. Start the Application
Run backend and frontend in separate terminals:
```bash
# Terminal 1: Start Backend (Port 5000)
npm run dev --prefix backend

# Terminal 2: Start Frontend (Port 5173)
npm run dev --prefix frontend
```
Visit `http://localhost:5173` in your browser.

---

## 🔐 Security & Privacy Policy

- **Zero Storage of Banking Secrets**: SmartShield AI **never** requests or stores bank passwords, ATM PINs, UPI PINs, or SMS OTPs.
- **Automated Text Redaction**: Submitted scam reports automatically redact phone numbers, emails, and codes before pattern clustering.
- **Row Level Security (RLS)**: Users maintain strict multi-tenant isolation; private investigation evidence is only accessible to the owner.
- **SSRF Hardening**: External URL lookups prohibit private IP ranges and loopback requests.

---

## 📞 Indian Cybercrime Emergency Contacts

- **National Cybercrime Helpline**: Dial `1930`
- **National Cybercrime Reporting Portal**: [https://cybercrime.gov.in/](https://cybercrime.gov.in/)
