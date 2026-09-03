---
document_type: specification_and_delivery_checklist
version: 0.6.0
rules:
  1_user_ownership: "The user adds new requirements, tasks, or bugfixes as unchecked items: [ ]"
  2_ai_verification_gate: "The AI agent may only check an item [x] AFTER all workspace tests (`cargo test --workspace`), linters (`cargo clippy --workspace -- -D warnings`), and builds (`npm run build`) pass cleanly with exit code 0."
  3_no_deletion: "The AI must NEVER delete or alter the user's backlog items without explicit instruction."
  4_atomic_commits: "Each completed milestone or feature should reference the corresponding checked items in its commit message."
---

# Project Specification & Delivery Checklist

This specification serves as the living checklist for features, architectural requirements, and deliverables in **SyntropyOS**. Items are added by the user as `[ ]` and marked as completed `[x]` by AI agents as they are implemented, verified, and merged.

---

## 📋 Delivery Status Overview

- **Current Version**: `v0.6.0`
- **Active Branch**: `main`
- **Rust Test Suite**: `15/15 passing`
- **Linter Status**: `cargo clippy --workspace -- -D warnings` (Passing)
- **Frontend Build**: `npm run build` (Passing)

---

## 🏛️ Architecture & Milestone Boundaries

```text
┌───────────────────────────────────────────────────────────────┐
│                    Desktop UI (`src/`)                        │
│             Tauri 2.0 + React 19 + TypeScript                 │
│      (Titlebar, Workstreams, Artifacts, FTA ROI Counter)      │
└──────────────────────────────┬────────────────────────────────┘
                               │ IPC (Typed JSON in snake_case)
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                    Desktop Host (`src-tauri`)                 │
│         Hardware Keystore (Keyring) + OAuth 2.0 PKCE          │
│          App Paths Resolver + Window & Shell Opener           │
└──────────────────────────────┬────────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────┐
│      `syntropy-core`          │   │     `syntropy-engine`     │
│   Blackboard Store (ACLs)     │   │     Rig.rs 0.42+ Client   │
│   Task DAG & Topological Sort │   │ 90/10 Asymmetric Routing  │
│   1-Hour Sprint Blueprint     │   │  3-State Circuit Breaker  │
└───────────────────────────────┘   └───────────────────────────┘
```

---

## ✅ Completed Deliverables (v0.6.0)

### Phase 1: Engine & Multi-Provider Architecture (`crates/syntropy-engine`)
- [x] **Multi-Provider Registry**: Support for Google Gemini, Anthropic Claude, OpenAI, and Groq via Rig.rs 0.42+.
- [x] **90/10 Asymmetric Model Routing**: Dynamic tier routing separating SME tasks (90% Fast Tier: `gemini-2.5-flash`, `llama-3.3-70b`) from Lead synthesis tasks (10% Reasoning Lead: `gemini-2.5-pro`, `claude-3-7-sonnet`).
- [x] **3-State Circuit Breaker**: Closed, Open, and HalfOpen state machine with canary probes, exponential backoff, and randomized jitter on 429/503 HTTP responses.
- [x] **Deterministic Destructive-Tool Filter**: Filters `rm`, `format_disk`, `drop_table`, `purge`, `delete_message`, and `truncate` before tool exposure.

### Phase 2: Core Models & Versioned Blackboard (`crates/syntropy-core`)
- [x] **4-Tier Federation Hierarchy**: Data models for `Federation`, `Workstream`, `Team`, `Sme`, and `LaborMetric`.
- [x] **Deterministic Blackboard URIs**: Schema `blackboard://{workstream_id}/{team_id}/{agent_id}/{artifact_name}@v{version}`.
- [x] **Zero-Trust Author Write ACLs**: Strict author write namespace enforcement (`WriteAclGuard`) returning `403 WriteAccessDenied` on unauthorized publish attempts.
- [x] **$O(1)$ Signal Broadcast Bus**: Lightweight metadata event broadcasts over `tokio::sync::broadcast` without full payload cascades.
- [x] **Task DAG & Topological Sort**: Directed Acyclic Graph engine with Kahn's topological sort and cycle detection.
- [x] **1-Hour Agentic Sprint Blueprint**: 4-phase structured SLA blueprint (`Understand & Map` $\rightarrow$ `Sketch & Ideate` $\rightarrow$ `Decide & Storyboard` $\rightarrow$ `Prototype & Synthesize`).

### Phase 3: Tauri 2.0 Host & Desktop Security (`src-tauri`)
- [x] **Cross-Platform OS Path Resolver**: Automatic resolution and creation of `app_data_dir` (`AppData\Roaming\syntrophyOS`), `extensions_dir`, and `blackboard_dir`.
- [x] **Hardware-Backed Keystore**: Secure API key storage backed by OS credential manager (`keyring`) with `zeroize::Zeroizing<String>` RAM scrubbing.
- [x] **Enterprise OAuth 2.0 PKCE Loopback**: Ephemeral HTTP server on `127.0.0.1:8989/oauth/callback` with CSRF state verification.
- [x] **Synchronized IPC Protocol**: Strongly-typed `WorkstreamCommand` and `WorkstreamEvent` matching frontend TypeScript contracts field-for-field in `snake_case`.
- [x] **Hardened Shell & Opener**: Shell injection mitigation using native `tauri-plugin-opener` with protocol validation.

### Phase 4: Modern Desktop UI (`src/`)
- [x] **Frameless Native Titlebar**: Custom drag region, status indicators, and white SVG logo in gradient container (`Titlebar.tsx`).
- [x] **Tri-Color Theme Engine**: Left (`#58a6ff`), Middle (`#c084fc`), Right (`#f472b6`) against GitHub dark surfaces (`#0d1117`, `#161b22`, `#21262d`, `#30363d`).
- [x] **Workstream Hub & Execution Kanban**: Blueprint deployment cards and 4-tier visual execution Kanban across sprint phases (`WorkstreamsView.tsx`).
- [x] **Artifacts Timeline & Diff Viewer**: Versioned Blackboard artifact viewer with author ACL badges and syntax-highlighted diffs (`ArtifactsView.tsx`).
- [x] **Real-Time Full-Time Agent (FTA) Valuation**: Dynamic labor hours counter with interactive 1–5 star manager calibration (`FtaCounter.tsx` & Sidebar badge).
- [x] **Human-in-the-Loop (HITL) Modal**: Tool mutation authorization modal intercepting destructive operations (`ApprovalModal.tsx`).
- [x] **Personalized Home Hero View**: Live clock, date, weather chip, and greeting header (`HomeHeroView.tsx`).

---

## 🚀 Active Specification Items & User Backlog

*Add your new feature requests, refinements, or bug reports below. When an AI agent completes an item and passes all tests, it will check the item as `[x]`.*

### User Feature Requests
- [ ] 
- [ ] 
- [ ] 

### Engine & Backend Enhancements
- [ ] 
- [ ] 
- [ ] 

### UI/UX & Frontend Refinements
- [ ] 
- [ ] 
- [ ] 
