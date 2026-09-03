# Request Brief — SyntropyOS V6 Architecture

> Authored by `intake-triage`. The single normalized statement of what was asked, before any evaluation.

- **Date received:** 2026-09-03
- **Source file/folder:** `c:\Users\tyson\.repo\personal\syntropyOS`
- **Requester / channel:** User Directive (1-Shot Autonomous Build & Verification)

## Raw Ask (verbatim)
Build the complete, production-grade SyntropyOS desktop platform: an enterprise-grade agentic operating system running on a pure Tauri 2.0 + Rig.rs (0.42+) native Rust runtime. The platform enables non-technical department managers to deploy, govern, and collaborate with autonomous, 4-tier agent federations using a decoupled, versioned Blackboard Store with author write ACLs, enterprise OAuth 2.0 loopback authentication, and a Full-Time Agent (FTA) ROI valuation framework.

## Restated Ask
Implement the complete SyntropyOS desktop system under `c:\Users\tyson\.repo\personal\syntropyOS` structured across 4 work packages:
1. `crates/syntropy-engine`: Rig.rs 0.42+ multi-provider runtime (Gemini, Anthropic, OpenAI, Groq), 90/10 asymmetric model routing, 3-state circuit breaker with exponential jitter backoff, native tools, MCP connector, and deterministic destructive-tool security filter.
2. `src-tauri`: Tauri 2.0 host, cross-platform path resolution (`src-tauri/src/paths.rs`), deterministic IPC protocol (`src-tauri/src/protocol.rs`), enterprise OAuth 2.0 PKCE loopback listener (`127.0.0.1:8989/oauth/callback`), and hardware keystore (`keyring`) with zeroize memory scrubbing.
3. `src/`: React 19 + TypeScript + Tailwind CSS + Lucide icons + Zustand desktop frontend with frameless window chrome, Workstream Hub, Team Execution Board (4-tier Kanban), Artifact Timeline, Settings Hub, live typewriter event streaming, HITL Tool Approval Modal, and FTA Valuation counter with 1-5 star calibration.
4. `crates/syntropy-core`: Versioned Blackboard Store (`blackboard://{workstream_id}/{team_id}/{agent_id}/{artifact_name}@v{version}`), zero-trust author write ACLs (403 WriteAccessDenied), broadcast signal bus with O(1) metadata pointers, plan synthesis pipeline (`AgentResult` -> `TeamPlan`), and flagship 1-Hour Agentic Sprint blueprint (Phases 1-4).

## Surface / Area Touched
- `crates/syntropy-core/`
- `crates/syntropy-engine/`
- `src-tauri/`
- `src/`
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`
- `Cargo.toml` (root workspace)

## Domain / Context Relevance
SyntropyOS is an autonomous agent operating system delivering high governance, auditability, and collaboration without groupthink or transcript explosion.

## Provisional Request Type
`new-system` / `greenfield-platform-build`

## Explicit Acceptance Signals
- Field-for-field contract synchronization between `src-tauri/src/protocol.rs` and `src/types/protocol.ts`.
- Zero CLI/terminal bloat (`reedline`, `crossterm` omitted).
- Zero mock stubs — live Rig engine executions and typed extractor pipeline.
- Versioned blackboard URI resolution with author write isolation.
- Passing `cargo check --workspace`, `cargo test --workspace`, `cargo clippy --workspace -- -D warnings`, and frontend build/typecheck.

## Verdict
**READY**
