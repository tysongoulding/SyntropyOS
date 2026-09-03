# Build Plan — SyntropyOS V6 Implementation

- **Author:** `build-planner`
- **Date:** 2026-09-03
- **Execution Strategy:** Strict Red-First TDD & Phased Workspace Construction

---

## 1. Ordered Implementation Tasks

### Task 1: Cargo Workspace & Crate Scaffolding
- Root `Cargo.toml` defining members: `crates/syntropy-core`, `crates/syntropy-engine`, `src-tauri`.
- Setup `.gitignore`.

### Task 2: `crates/syntropy-core` Implementation
- `Cargo.toml` with dependencies (`serde`, `serde_json`, `tokio`, `thiserror`, `tracing`, `chrono`, `regex`, `sha2`, `uuid`).
- Red tests: `tests/blackboard_tests.rs`, `tests/dag_tests.rs`, `tests/sprint_tests.rs`.
- Implementation:
  - `src/models.rs`: 4-tier hierarchy data structures.
  - `src/blackboard.rs`: URI parser, write ACL guard, versioned store, broadcast bus.
  - `src/dag.rs`: Task DAG, cycle check, topological sort.
  - `src/synthesis.rs`: `AgentResult` -> `TeamPlan` schema.
  - `src/blueprints/mod.rs` & `src/blueprints/sprint.rs`: 1-Hour Agentic Sprint blueprint.
- Prove tests GREEN: `cargo test -p syntropy-core`.

### Task 3: `crates/syntropy-engine` Implementation
- `Cargo.toml` with dependencies (`rig-core = "0.42.0"`, `schemars`, `tokio`, `serde`, `serde_json`, `thiserror`, `tracing`, `rand`, `reqwest`).
- Red tests: `tests/routing_tests.rs`, `tests/resilience_tests.rs`, `tests/tool_tests.rs`.
- Implementation:
  - `src/providers.rs`: Provider configurations & client builders.
  - `src/routing.rs`: 90/10 asymmetric router (`SmeFast` vs `ReasoningLead`).
  - `src/resilience.rs`: 3-state circuit breaker (`Closed`, `Open`, `HalfOpen`) with canary probe and exponential jitter backoff.
  - `src/tools/mod.rs`: Native tools, MCP connector stub, and deterministic destructive-tool security filter.
- Prove tests GREEN: `cargo test -p syntropy-engine`.

### Task 4: `src-tauri` Host & Security Implementation
- `Cargo.toml` with `tauri = { version = "2", features = ["tray-icon"] }`, `dirs`, `keyring`, `zeroize`, `tokio`, `serde`, `serde_json`, `syntropy-core`, `syntropy-engine`.
- Tauri configuration files: `tauri.conf.json`, `capabilities/default.json`.
- Implementation:
  - `src/paths.rs`: Cross-platform paths and auto-creation.
  - `src/protocol.rs`: Typed command/event contracts.
  - `src/oauth.rs`: Enterprise OAuth 2.0 PKCE loopback on `127.0.0.1:8989`.
  - `src/keystore.rs`: Hardware keystore with zeroize.
  - `src/lib.rs` & `src/main.rs`: Tauri commands, event emissions, app setup.
- Prove tests GREEN: `cargo test -p syntropyOS-tauri`.

### Task 5: Frontend (`src/`) Implementation
- Package configuration: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`.
- Synchronized contracts: `src/types/protocol.ts`.
- Stores: `src/stores/useWorkstreamStore.ts`, `src/stores/useFtaStore.ts`, `src/stores/useSettingsStore.ts`.
- Components: `WindowChrome.tsx`, `ApprovalModal.tsx`, `FtaCounter.tsx`, `TypewriterStream.tsx`.
- Views: `WorkstreamHub.tsx`, `ExecutionBoard.tsx`, `ArtifactTimeline.tsx`, `SettingsHub.tsx`.
- `App.tsx`, `main.tsx`, `index.html`.
- Verification: `npm install` and `npm run build`.

### Task 6: Full Verification & Sign-off
- `cargo check --workspace`
- `cargo test --workspace`
- `cargo clippy --workspace -- -D warnings`
- `npm run build`
- Synthesize `build-report.md`.
