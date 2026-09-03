# Build Brief — SyntropyOS V6 Implementation

- **Author:** `build-triage`
- **Date:** 2026-09-03
- **Input Plans:**
  - `intake/2026-09-03-v6-architecture/technical-plan.md`
  - `intake/2026-09-03-v6-architecture/qa/test-plan.md`
- **Target Repository:** `c:\Users\tyson\.repo\personal\syntropyOS`

## 1. Readiness Confirmation
- `technical-plan.md` exists and details workspace crates, file structures, and algorithms.
- `test-plan.md` exists and provides exact unit, integration, and verification test requirements.
- Dev tools available: `cargo 1.98.0`, `rustc 1.98.0`, `node 24.16.0`, `npm 11.15.0`.
- Clean workspace initialized with git repo.

## 2. Mandatory Guardrails
- **MANDATORY:** Author write ACLs on blackboard URIs.
- **MANDATORY:** 90/10 asymmetric model routing.
- **MANDATORY:** 3-state circuit breaker with exponential backoff & jitter.
- **MANDATORY:** Zero CLI / terminal bloat (`reedline`, `crossterm` excluded).
- **MANDATORY:** Deterministic destructive-tool filter.
- **MANDATORY:** Protocol serialization matching field-for-field in `snake_case`.
- **MANDATORY:** Hardware keystore + Zeroize memory scrubbing.
- **MANDATORY:** React 19 + TypeScript + Tailwind CSS desktop UI with HITL modal and FTA counter.

## Verdict
**READY TO BUILD**
