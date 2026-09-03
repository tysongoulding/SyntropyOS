# BACKEND.md — Backend Architecture & Engine Guide

SyntropyOS is powered by a native Rust workspace consisting of three primary crates:

```text
crates/
├── syntropy-core/      # Domain logic, Blackboard Store, DAG engine, 4-tier models
└── syntropy-engine/    # Rig.rs 0.42+ client, 90/10 asymmetric router, circuit breaker
src-tauri/              # Tauri 2.0 desktop host, hardware keystore, OAuth, IPC protocol
```

---

## 🏛️ 1. Crates & Responsibilities

### `crates/syntropy-core`
- **Models (`models.rs`)**: Implements the 4-tier federation hierarchy (`Federation` $\rightarrow$ `Workstream` $\rightarrow$ `Team` $\rightarrow$ `Sme`). Tracks `WorkstreamStatus`, `Milestone`, and `LaborMetric`.
- **Blackboard Store (`blackboard.rs`)**:
  - Deterministic URI parsing: `blackboard://{workstream_id}/{team_id}/{agent_id}/{artifact_name}@v{version}`
  - Zero-trust write access control (`WriteAclGuard`): Throws `BlackboardError::WriteAccessDenied` if `caller_agent_id != uri.agent_id` or `artifact.author_id != uri.agent_id`.
  - Immutable version increments and SHA-256 content hashing.
  - $O(1)$ signal broadcast bus: Emits lightweight metadata notifications over `tokio::sync::broadcast` without raw payload bubbling.
- **DAG Engine (`dag.rs`)**: Task dependency graph with Kahn's topological sort and cycle detection (`detect_cycle()`).
- **Blueprints (`blueprints/sprint.rs`)**: Flagship 1-Hour Agentic Sprint blueprint structured into 4 rigid phases:
  1. *Understand & Map* (00–15m) — Research SMEs
  2. *Sketch & Ideate* (15–30m) — Architect SMEs
  3. *Decide & Storyboard* (30–45m) — Team PM & Evaluators
  4. *Prototype & Synthesize* (45–60m) — Builders & QA

### `crates/syntropy-engine`
- **Provider Registry (`providers.rs`)**: Unified client instantiation for Google Gemini, Anthropic Claude, OpenAI, and Groq via `rig-core = "0.42.0"`.
- **Asymmetric 90/10 Model Router (`routing.rs`)**:
  - **90% SME Tier (`SmeFast`)**: Mapped to high-throughput, low-cost models (`gemini-2.5-flash`, `llama-3.3-70b`) for data extraction, parsing, code generation, and drafts.
  - **10% Lead Tier (`ReasoningLead`)**: Mapped to frontier reasoning models (`gemini-2.5-pro`, `claude-3-7-sonnet`) for plan synthesis, architectural review, and decision gates.
- **3-State Circuit Breaker (`resilience.rs`)**:
  - `Closed` $\rightarrow$ `Open` $\rightarrow$ `HalfOpen` state machine.
  - Trips to `Open` after 3 consecutive failures.
  - Cools down for 30s before admitting a canary probe in `HalfOpen`.
  - Exponential backoff with randomized jitter on HTTP 429/503 rate limits (1s, 2s, 4s, 8s + jitter).
- **Tools & Security Filter (`tools/mod.rs`)**:
  - Deterministic `SecurityFilter` that strips destructive tools (`rm`, `format_disk`, `drop_table`, `purge`, `delete_message`, `truncate`).
  - MCP connector abstraction for external server registrations.

### `src-tauri`
- **Cross-Platform Paths (`paths.rs`)**: Resolves `app_data_dir`, `extensions_dir`, and `blackboard_dir` across Windows (`AppData\Roaming\syntrophyOS`), macOS (`~/Library/Application Support`), and Linux (`~/.config`). Auto-created on startup.
- **Hardware Keystore (`keystore.rs`)**: Key storage backed by OS credential manager (`keyring`) with `zeroize::Zeroizing<String>` RAM scrubbing.
- **Enterprise OAuth 2.0 PKCE (`oauth.rs`)**: Ephemeral loopback listener on `127.0.0.1:8989/oauth/callback` with CSRF state verification.
- **Tauri IPC Command Router (`commands.rs` & `lib.rs`)**:
  - `execute_command`: Handles workstream launch, blackboard queries, and FTA calibration.
  - Window controls: `start_drag_window`, `minimize_window`, `toggle_maximize_window`, `close_window`.
  - Shell opener: `open_local_path` and `open_external_url` via `tauri-plugin-opener`.

---

## 🔒 2. Backend Security Invariants

1. **Memory Scrubbing**: Sensitive strings (API keys, tokens) must never use standard `String` for long-lived in-memory storage; use `zeroize::Zeroizing<String>`.
2. **Safe Shell Execution**: Never execute raw OS shell commands (`std::process::Command::new("cmd")`). Use `tauri-plugin-opener` with protocol validation (`http://`, `https://`).
3. **No Unsafe Code**: The entire workspace enforces 100% safe Rust. No `unsafe` blocks are permitted.

---

## 🧪 3. Backend Verification

```powershell
# Run the complete test suite
cargo test --workspace

# Run Clippy with zero tolerance for warnings
cargo clippy --workspace -- -D warnings
```
