# SmartShield AI - Database Schema Documentation

## Entity Relationship Overview

The database leverages Supabase PostgreSQL with strict Row Level Security (RLS) enforcement. All entities are linked via foreign keys with cascading semantics on user/investigation lifecycle events.

### Core Tables

1. **`profiles`**:
   - `id`: UUID (Primary Key, matches Supabase Auth UID)
   - `email`: TEXT UNIQUE NOT NULL
   - `password_hash`: TEXT NOT NULL
   - `full_name`: TEXT NOT NULL
   - `phone_number`: TEXT
   - `role`: TEXT ('user', 'admin', 'auditor')

2. **`investigations`**:
   - `id`: UUID (PK)
   - `user_id`: UUID (FK -> profiles.id)
   - `title`: TEXT
   - `status`: TEXT ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')
   - `overall_risk_level`: TEXT ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INSUFFICIENT EVIDENCE')
   - `overall_risk_score`: INTEGER (0 - 100)
   - `confidence_score`: INTEGER (0 - 100)
   - `explanation_markdown`: TEXT
   - `recommended_actions`: JSONB array of action items
   - `missing_information`: JSONB array of missing context items

3. **`evidence`**:
   - `id`: UUID (PK)
   - `investigation_id`: UUID (FK -> investigations.id)
   - `user_id`: UUID (FK -> profiles.id)
   - `evidence_type`: TEXT ('MESSAGE', 'URL', 'SCREENSHOT', 'UPI', 'QR', 'SENDER_ID', 'OTHER')
   - `raw_content`: TEXT
   - `extracted_entities`: JSONB (domains, phones, UPIs, amounts, dates)
   - `file_path`: TEXT
   - `file_hash`: SHA-256 string for integrity preservation
   - `mime_type`: TEXT
   - `reliability_score`: NUMERIC(3, 2) (0.00 to 1.00)

4. **`threat_indicators`**:
   - `id`: UUID (PK)
   - `investigation_id`: UUID (FK -> investigations.id)
   - `evidence_id`: UUID (FK -> evidence.id)
   - `indicator_type`: TEXT
   - `category`: TEXT ('COERCION', 'URGENCY', 'FINANCIAL', 'IMPERSONATION', 'MALICIOUS_LINK', 'CREDENTIAL_HARVESTING', 'IDENTITY_DECEPTION', 'REMOTE_ACCESS')
   - `severity`: TEXT ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
   - `confidence`: INTEGER (0 - 100)
   - `explanation`: TEXT
   - `raw_matched_pattern`: TEXT
   - `verification_status`: TEXT

5. **`investigation_relationships`**:
   - `id`: UUID (PK)
   - `investigation_id`: UUID (FK -> investigations.id)
   - `source_entity_id`, `source_entity_type`, `source_label`
   - `target_entity_id`, `target_entity_type`, `target_label`
   - `relationship_type`: TEXT (e.g., 'MENTIONED_IN_MESSAGE', 'HOSTS_DOMAIN', 'REQUESTS_PAYMENT_TO')
   - `confidence`: INTEGER
   - `evidence_id`: UUID (FK -> evidence.id)

6. **`risk_assessments`**:
   - Historical snapshot of deterministic risk computations per version.

7. **`payment_investigations`**:
   - Payment-specific checks (UPI VPA, QR payload, amounts, collect request flags).

8. **`emergency_contacts`**:
   - User-defined family/trusted contacts with explicit timestamped consent.

9. **`recovery_cases`**:
   - Indian incident response cases (1930 Cybercrime reference, bank escalations, evidence bundle).

10. **`scam_pattern_clusters` & `scam_reports`**:
    - Anonymized community threat signatures with admin review workflow.
