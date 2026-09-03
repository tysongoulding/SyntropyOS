# PM Plan — SyntropyOS V6 Architecture

- **Author:** `intake-project-manager`
- **Target:** SyntropyOS V6 Native Desktop Platform
- **Date:** 2026-09-03
- **Classification:** Greenfield Architecture Build & Platform Re-platforming

## 1. Context & Business Case
SyntropyOS moves from an extension-script platform to a native Tauri 2.0 + Rig.rs 0.42+ enterprise desktop operating system. It targets non-technical department managers who require multi-agent autonomy with strict governance, auditability, zero transcript bloat, and demonstrable ROI via Full-Time Agent (FTA) labor metrics.

## 2. Work Breakdown Structure (WBS)
- **WP-1: Core Domain & Blackboard Engine (`crates/syntropy-core`)**
  - 4-Tier Hierarchy Data Models (`Federation > Workstream > Team > SME`).
  - Thread-Safe Versioned Blackboard Store with URI scheme `blackboard://...`.
  - Zero-Trust Author Write ACLs & Signal Broadcast Bus.
  - Plan Synthesis Pipeline (`AgentResult` -> `TeamPlan`).
  - Flagship 1-Hour Agentic Sprint Blueprint.
- **WP-2: Execution & Resilience Engine (`crates/syntropy-engine`)**
  - Rig.rs 0.42+ Multi-Provider Engine (Gemini, Anthropic, OpenAI, Groq).
  - Asymmetric 90/10 Model Routing.
  - 3-State Circuit Breaker with Exponential Backoff + Jitter.
  - Tool Registry & Deterministic Destructive Filter.
- **WP-3: Desktop Host & Keystore (`src-tauri`)**
  - Tauri 2.0 Native Application Scaffold & Configuration.
  - Cross-Platform Path Resolution (`paths.rs`).
  - Typed IPC Protocol Router (`protocol.rs`).
  - Enterprise OAuth 2.0 PKCE Loopback (`127.0.0.1:8989`).
  - Hardware Keystore (`keyring`) & RAM Scrubbing (`zeroize`).
- **WP-4: Modern Desktop GUI (`src/`)**
  - React 19 + TypeScript + Tailwind CSS + Lucide Icons.
  - Frameless Window Chrome & Navigation.
  - Workstream Hub, Team Execution Board (Kanban), Artifact Timeline, Settings Hub.
  - Live Typewriter Streaming Receiver.
  - Human-in-the-Loop (HITL) Tool Approval Modal.
  - Full-Time Agent (FTA) Real-Time ROI Counter & 1-5 Star Calibration.

## 3. Milestones & Gates
1. **Gate 1 (Core & Engine):** Rust crates pass unit tests for blackboard ACLs, DAG validation, circuit breaker, and model routing.
2. **Gate 2 (Host & IPC):** Tauri 2.0 backend compiles with path resolution, keystore, and IPC protocol handlers.
3. **Gate 3 (Frontend & Streaming):** React 19 UI builds cleanly and renders all 4 views, modal, and FTA counter.
4. **Gate 4 (Full Verification):** `cargo check`, `cargo test`, `cargo clippy`, and `npm run build` succeed with zero errors.
