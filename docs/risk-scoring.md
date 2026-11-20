# SmartShield AI - Risk Scoring Methodology

## Philosophy: Non-Hallucinatory, Deterministic Risk Scoring

In high-stakes fraud detection, generative AI must **never** be permitted to fabricate numeric risk probabilities or hallucinate arbitrary percentages. SmartShield AI enforces a decoupled architecture:
1. **Specialist Agents** detect, verify, and categorize evidence indicators with confidence values and source markers.
2. The **Deterministic Risk Engine** processes the collected structured indicators using an auditable, mathematical scoring formula.

## Risk Categories & Level Thresholds

| Risk Level | Score Range | Definition | Action Requirement |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | 80 – 100 | Active coercion, confirmed phishing domains, digital arrest, or remote-access manipulation | Immediate isolation, do NOT send money, call 1930 |
| **HIGH** | 60 – 79 | Strong malicious intent (fake bank KYC, pay-to-receive QR scam, unverified urgency) | Halt interaction, verify through official channels |
| **MEDIUM** | 35 – 59 | Suspicious signals, lookalike domain traits, unknown sender with financial mentions | Proceed with caution, request secondary verification |
| **LOW** | 1 – 34 | Routine transactional context, verified domains, absence of coercive patterns | Normal vigilance |
| **INSUFFICIENT EVIDENCE** | N/A | Missing text, unparseable images, or lack of actionable identifiers | Prompt user for additional context |

## Mathematical Scoring Formula

Let $I = \{i_1, i_2, \dots, i_n\}$ be the set of verified indicators.

Each indicator $i$ has:
- Base Severity Weight $W_{sev}(i) \in \{10, 25, 45, 75\}$ for [LOW, MEDIUM, HIGH, CRITICAL]
- Category Dampener $C_{cat} \in (0, 1]$ to prevent runaway stacking of identical category signals (e.g. 5 urgency words in one message)
- Source Reliability Factor $R_{src} \in [0.5, 1.0]$ (e.g., threat intelligence match = 1.0; OCR text inference = 0.85)
- Confidence Factor $Conf(i) \in [0.0, 1.0]$

$$\text{Effective Indicator Weight } EW(i) = W_{sev}(i) \times C_{cat} \times R_{src} \times Conf(i)$$

$$\text{Raw Aggregate} = \sum_{k=1}^{n} EW(i_k) \times \text{DiminishingReturnsMultiplier}(k)$$

$$\text{Normalized Score} = \min(100, \max(0, \text{Round}(\text{Raw Aggregate})))$$

### Anti-Double-Counting & Deduplication
If an indicator is triggered both by a raw message pattern and a screenshot OCR of that same message, the engine collapses them into a single primary indicator with an elevated confidence multiplier rather than adding them as independent threats.
