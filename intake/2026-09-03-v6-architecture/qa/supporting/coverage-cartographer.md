# Coverage Cartographer — SyntropyOS V6

- **Author:** `qa-coverage-cartographer`
- **Date:** 2026-09-03
- **Baseline:** Greenfield repo. Baseline coverage: 0% (Clean slate).

## Target Coverage Map
1. `crates/syntropy-core`:
   - `test_uri_parsing_valid_and_invalid`: 100% branch coverage of URI parser.
   - `test_blackboard_write_acl_enforcement`: Positive test (authorized agent) and Negative test (unauthorized agent yields `WriteAccessDenied`).
   - `test_blackboard_versioning_and_read`: Multi-version writes and retrieval by version tag or latest.
   - `test_signal_bus_broadcast`: Verify listener receives lightweight metadata signal without full artifact payload.
   - `test_dag_cycle_detection_and_topo_sort`: Verify acyclic execution and failure on cyclic graph.
   - `test_one_hour_sprint_phases`: Blueprint structural completeness across Phases 1-4.
2. `crates/syntropy-engine`:
   - `test_model_router_90_10`: Verify SME tasks map to `SmeFast` and lead/PM tasks map to `ReasoningLead`.
   - `test_circuit_breaker_transitions`: Test Closed -> 3 failures -> Open -> cooldown -> HalfOpen -> success -> Closed.
   - `test_security_filter_strips_destructive_tools`: Verify `delete_message`, `trash_message`, `drop_table`, `purge` stripped from manifest.
3. `src-tauri`:
   - `test_paths_resolution`: Cross-platform path resolution test.
   - `test_protocol_serialization`: Parity test for JSON command and event structures.
4. `src/` (Frontend):
   - TypeScript compile checks (`npm run build` / `typecheck`).
   - Store state updates and event handling tests.
