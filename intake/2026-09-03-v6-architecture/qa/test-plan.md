# Test Plan — SyntropyOS V6 Architecture

- **Author:** `qa-lead`
- **Target Repository:** `c:\Users\tyson\.repo\personal\syntropyOS`
- **Date:** 2026-09-03
- **Status:** Approved Test Plan

---

## 1. Test Suite Definitions

### 1.1 `syntropy-core` Unit Test Suite
- `tests/blackboard_tests.rs`:
  - `test_valid_uri_parsing`: Parse valid `blackboard://ws1/team1/agent1/brief@v1` into components.
  - `test_invalid_uri_rejection`: Reject malformed schemes, missing versions, or invalid characters.
  - `test_write_acl_authorized`: Agent `sme_research` writes to `.../sme_research/...` -> Ok.
  - `test_write_acl_denied`: Agent `sme_other` writes to `.../sme_research/...` -> `Err(BlackboardError::WriteAccessDenied)`.
  - `test_version_increment`: Successive writes bump versions from `@v1` to `@v2`.
  - `test_signal_bus_broadcast`: Check that subscriber receives lightweight metadata signal.
- `tests/dag_tests.rs`:
  - `test_dag_execution_order`: Topological sort produces valid execution stages.
  - `test_dag_cycle_detection`: Graph with cycle returns error.
- `tests/sprint_tests.rs`:
  - `test_blueprint_phases`: 1-Hour Sprint Blueprint contains all 4 phases and valid SME task allocations.

### 1.2 `syntropy-engine` Unit Test Suite
- `tests/routing_tests.rs`:
  - `test_90_10_tier_routing`: Verify SME task mapped to fast tier; Lead/PM task mapped to reasoning tier.
- `tests/resilience_tests.rs`:
  - `test_circuit_breaker_transitions`: Closed -> 3 failures -> Open -> cooldown -> HalfOpen -> success -> Closed.
  - `test_backoff_jitter_bounds`: Verify exponential delay within expected ranges.
- `tests/tool_tests.rs`:
  - `test_security_filter_strips_destructive`: Verify `delete_message`, `trash_message`, `purge`, `drop_table` are stripped.
  - `test_safe_tools_allowed`: Normal read and query tools are retained.

### 1.3 `src-tauri` Host & Protocol Tests
- `tests/paths_tests.rs`: Verify path resolution across Windows/macOS/Linux.
- `tests/protocol_tests.rs`: Parity tests verifying JSON serialization of commands and events.

### 1.4 Frontend Verification
- `npm run build` or `npm run typecheck`: Validates full React 19 + TypeScript build with zero compilation errors.

---

## 2. Definition of Done & Commands
```bash
cargo test --workspace
cargo check --workspace
cargo clippy --workspace -- -D warnings
npm run build
```
