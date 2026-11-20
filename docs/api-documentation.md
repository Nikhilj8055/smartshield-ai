# SmartShield AI - REST API Documentation (v1)

Base URL: `/api/v1`

## 1. Authentication (`/api/v1/auth`)
- `POST /register`: Create a new user profile.
  - Body: `{ email, password, full_name, phone_number? }`
- `POST /login`: Authenticate and receive JWT token.
  - Body: `{ email, password }`
- `GET /me`: Fetch authenticated user profile & preferences.

## 2. Investigations (`/api/v1/investigations`)
- `POST /`: Initialize a new investigation.
  - Body: `{ title, type?, initial_evidence? }`
- `GET /`: List recent investigations for authenticated user.
- `GET /:id`: Retrieve detailed investigation dossier including evidence, risk assessment, explanation, and action items.
- `POST /:id/evidence`: Append new evidence (message, URL, or screenshot) to existing investigation and trigger re-correlation.
- `DELETE /:id`: Delete investigation and associated evidence.

## 3. Specialized Analysis Endpoints
- `POST /analyze/message`: Analyze raw SMS/WhatsApp text for coercive patterns, fake KYC, urgency, and extract entities.
- `POST /analyze/url`: Evaluate domain reputation, Punycode, typosquatting, shorteners, and threat intel feeds.
- `POST /analyze/screenshot`: Upload and OCR an image, extracting entities and running threat detection.
- `POST /analyze/payment`: Evaluate UPI ID syntax, known scam patterns, and decode QR payloads.
- `POST /analyze/emergency`: Rapid triage for coercion, digital arrest threats, and fake law enforcement claims.

## 4. Scam Journey Intelligence (`/api/v1/scam-journey`)
- `GET /:investigationId/graph`: Retrieve interactive graph nodes and edges representing entities (phone, domain, UPI, organization) and relationships.

## 5. Emerging Scam Discovery (`/api/v1/scam-patterns`)
- `GET /clusters`: Fetch verified community scam pattern clusters.
- `POST /report`: Submit an anonymized scam message for pattern clustering (requires user consent).

## 6. Scam Recovery Command Centre (`/api/v1/recovery`)
- `POST /cases`: File an incident recovery case.
- `GET /cases`: Retrieve all recovery cases for user.
- `GET /cases/:id`: Detailed timeline, bank escalation script, 1930 reporting reference.
- `PATCH /cases/:id/status`: Update case status (`OPEN`, `BANK_CONTACTED`, `REPORTED`, etc.).

## 7. Emergency Contacts (`/api/v1/emergency/contacts`)
- `GET /`: List trusted contacts.
- `POST /`: Add a trusted contact with explicit consent flag.
- `DELETE /:id`: Remove a trusted contact.
