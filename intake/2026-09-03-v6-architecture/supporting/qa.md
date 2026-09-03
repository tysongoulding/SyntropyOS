# QA Assessment — SyntropyOS V6 Verification Gates

- **Role:** `intake-qa`
- **Date:** 2026-09-03
- **Focus:** Verification strategy, red-first TDD targets, invariant validation

## 1. Test Strategy & Invariant Guardrails
1. **Blackboard Isolation Invariant:**
   - Writing to `blackboard://ws1/team1/agentA/doc@v1` by `agentB` MUST return `Err(BlackboardError::WriteAccessDenied)`.
   - Writing to `blackboard://ws1/team1/agentA/doc@v1` by `agentA` MUST succeed and increment/version appropriately.
2. **Signal Bus Overhead Invariant:**
   - Verifying signal payload contains only URI, version, author, timestamp, hash, and metadata without full body payload.
3. **Model Routing Invariant:**
   - SME tasks resolve to fast high-throughput models (`gemini-2.5-flash`, etc.).
   - Lead/PM synthesis tasks resolve to frontier reasoning models (`gemini-2.5-pro`, `claude-3-7-sonnet`).
4. **Circuit Breaker State Transitions:**
   - Closed -> 3 consecutive failures -> Open.
   - Open -> duration elapsed -> HalfOpen.
   - HalfOpen -> success -> Closed.
   - Backoff with exponential jitter matches expected bounds.
5. **Security Filter Invariant:**
   - Manifest scanner strips `delete_message`, `trash_message`, `purge`, `drop_table`.
6. **Protocol Synchronization Invariant:**
   - Serialization and deserialization parity between Rust `protocol.rs` and TypeScript `protocol.ts`.
7. **Cross-Platform Path Invariant:**
   - Directories are resolved correctly across Windows, macOS, and Linux, and created on boot.
