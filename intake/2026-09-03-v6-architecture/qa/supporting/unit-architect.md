# Unit Architect Specification — SyntropyOS V6

- **Author:** `qa-unit-architect`
- **Date:** 2026-09-03
- **Scope:** Unit and property tests for `syntropy-core` and `syntropy-engine`.

## Unit Test Matrix
1. `syntropy-core`:
   - `blackboard::tests::test_uri_roundtrip_and_validation`
   - `blackboard::tests::test_author_write_acl_enforcement` (Authorized vs 403 WriteAccessDenied)
   - `blackboard::tests::test_version_increment_and_lookup`
   - `blackboard::tests::test_signal_bus_broadcast_receives_metadata`
   - `dag::tests::test_topological_sort_linear`
   - `dag::tests::test_topological_sort_branching`
   - `dag::tests::test_cycle_detection`
   - `sprint::tests::test_one_hour_sprint_phases_and_roles`
2. `syntropy-engine`:
   - `routing::tests::test_sme_vs_reasoning_tier_allocation`
   - `resilience::tests::test_circuit_breaker_transitions`
   - `resilience::tests::test_exponential_backoff_bounds`
   - `tools::tests::test_security_filter_removes_destructive_tools`
   - `tools::tests::test_safe_tools_preserved`
