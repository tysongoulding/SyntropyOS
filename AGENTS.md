# AGENTS.md — Developer & AI Agent Guide

Welcome to the **SyntropyOS** codebase. This document outlines mandatory architecture rules, naming conventions, security hygiene policies, and verification gates for all human developers and autonomous AI coding agents working in this repository.

---

## 🏛️ Core Architecture Overview

SyntropyOS is organized as a unified monorepo running a native Rust engine wrapped by a Tauri 2.0 desktop shell and a React 19 frontend:

```text
SyntropyOS/
├── Cargo.toml                  # Workspace manifest (syntropy-core, syntropy-engine, src-tauri)
├── crates/
│   ├── syntropy-core/          # Blackboard Store, DAG engine, 4-tier models, Sprint blueprints
│   └── syntropy-engine/        # Rig.rs 0.42+ engine, 90/10 asymmetric router, circuit breaker, tools
├── src-tauri/                  # Tauri 2.0 desktop host, hardware keystore, OAuth PKCE, paths, IPC
├── src/                        # React 19 + TypeScript + Tailwind CSS desktop UI (Tri-Color theme)
├── docs/                       # Modular documentation
│   ├── FRONTEND.md             # Frontend architecture, components, Zustand stores, styling
│   ├── BACKEND.md              # Rust engine, Rig.rs adapter, Blackboard URI & ACL specifications
│   └── ORCHESTRATION.md        # 4-tier federation, Blackboard store, DAG engine, 1-Hour Sprint
└── SPEC.md                     # Living requirements and task checklist
```

---

## 🔒 Security & Secrets Hygiene (Zero-Tolerance Rules)

1. **Zero Hardcoded Secrets**:
   * NEVER commit API keys, tokens, client secrets, private keys, or passwords to Git.
   * Scans for patterns like `sk-*`, `AIza*`, `ghp_*`, or `Bearer *` must always return 0 matches.
   * `.env` and `.env.*` files are strictly gitignored (only `.env.example` allowed).
2. **Hardware Keystore & Memory Scrubbing**:
   * All LLM API keys and OAuth tokens must be stored in the OS hardware keystore (`keyring` via Windows DPAPI / macOS Keychain / Linux Secret Service).
   * In-memory key material must always be wrapped in `zeroize::Zeroizing<String>` to guarantee RAM scrubbing upon deallocation.
3. **Blackboard Zero-Trust Write ACLs**:
   * Any write operation to `BlackboardStore::publish(caller_agent_id, artifact)` MUST be author-isolated.
   * `caller_agent_id` must match `uri.agent_id` and `artifact.author_id`. Never bypass or disable `WriteAclGuard`.
4. **Deterministic Destructive-Tool Filter**:
   * Destructive tool execution (`rm`, `format_disk`, `drop_table`, `purge`, `delete_message`, `truncate`) is banned from LLM prompt manifests via `SecurityFilter`.
   * External tool executions must always be gated behind the Human-in-the-Loop (HITL) approval modal.
5. **No Shell Injections**:
   * Never invoke OS shells with string interpolation (e.g. `cmd /c start &url`). Use audited Tauri plugins (`tauri-plugin-opener`) with URL protocol whitelisting (`http://`, `https://`).

---

## 🏷️ Naming & Serialization Conventions

| Target | Convention | Example |
|---|---|---|
| **Rust Crates & Modules** | `snake_case` | `syntropy_core`, `blackboard.rs`, `paths.rs` |
| **Rust Types & Traits** | `PascalCase` | `BlackboardStore`, `ModelRouter`, `CircuitBreaker` |
| **Rust Functions & Fields** | `snake_case` | `get_system_status()`, `total_hours_saved` |
| **IPC Protocols (Rust & TS)** | `snake_case` | `launch_workstream`, `workstream_name`, `blueprint_id` |
| **React Components** | `PascalCase.tsx` | `WorkstreamsView.tsx`, `Titlebar.tsx`, `Statusbar.tsx` |
| **Zustand Stores** | `camelCase.ts` | `useWorkstreamStore.ts`, `themeStore.ts`, `uiStore.ts` |
| **Blackboard URIs** | Deterministic URI | `blackboard://{ws_id}/{team_id}/{agent_id}/{artifact}@v{ver}` |

> [!IMPORTANT]
> **Contract-First Synchronization**: Every field and enum variant in `src-tauri/src/protocol.rs` MUST match field-for-field with `src/types/protocol.ts` and `src/lib/protocol.ts` using `snake_case`.

---

## 🎨 Theme & Visual Design Tokens

The desktop user interface is styled using a tri-color identity gradient against GitHub Dark surfaces:
* **Left (`#58a6ff` • Electric Blue)**: Primary action links, active state indicators, SME Fast tier chips (`90% Fast Tier`).
* **Middle (`#c084fc` • Purple-400)**: Reasoning Lead tier badges (`10% Reasoning Lead`), section headers, mid-tone gradient transitions.
* **Right (`#f472b6` • Pink-400)**: Real-time FTA ROI valuation counters, high-priority status badges, milestone completion flags.
* **Header / Logo Icon**: Pure white (`text-white fill-white`) SVG inside the gradient container.

---

## 🧪 Closed-Loop Verification Gates

No task is complete until the following three gates pass with exit code 0:

```powershell
# Gate 1: Rust Workspace Tests (All unit & integration tests pass)
cargo test --workspace

# Gate 2: Rust Workspace Clippy (Zero warnings, zero errors)
cargo clippy --workspace -- -D warnings

# Gate 3: Frontend TypeScript Typecheck & Production Bundle
npm run build
```

---

---

## 🤖 Autonomous Context Loading Directives (Mandatory for AI Agents)

All AI agents operating in this repository MUST autonomously read the relevant domain specification before analyzing, planning, or writing code:

| Task Domain / Scope | Mandatory Document to Read First | Contents & Enforced Invariants |
|---|---|---|
| **Frontend & UI**: Views, Components, Layout, Styling, Themes, Zustand Stores, Tauri IPC client | [`docs/FRONTEND.md`](docs/FRONTEND.md) | Enforces React 19 patterns, electric tri-color tokens (`#58a6ff`, `#c084fc`, `#f472b6`), and Zustand store registry. |
| **Backend & Engine**: Tauri 2.0 host, Rust crates, Keystore, Paths, OAuth, Rig.rs providers, Resilience | [`docs/BACKEND.md`](docs/BACKEND.md) | Enforces 100% safe Rust, hardware keystore (`keyring` + `Zeroizing<String>`), `tauri-plugin-opener`, and zero shell injection. |
| **Orchestration & Federation**: Swarms, Blackboard Store, Write ACLs, Task DAG, Sprints, 90/10 Router | [`docs/ORCHESTRATION.md`](docs/ORCHESTRATION.md) | Enforces 4-tier hierarchy, author write isolation, $O(1)$ signal bus, and 1-Hour Sprint blueprint invariants. |
| **Deliverables & Tasks**: Backlog items, user requirements, status checks, progress tracking | [`SPEC.md`](SPEC.md) | Enforces living checklist rules (`[ ]` user adds, `[x]` AI marks only after 3-gate verification passes). |

> [!IMPORTANT]
> **No Blind Edits**: AI agents must never modify files in `src/`, `src-tauri/`, or `crates/` without first loading the corresponding domain guide via `view_file`.

