# Technical Plan — SyntropyOS V6 Architecture

- **Author:** `intake-tech-lead`
- **Target Repository:** `c:\Users\tyson\.repo\personal\syntropyOS`
- **Date:** 2026-09-03
- **Status:** Approved Technical Plan

---

## 1. System Architecture & Cargo Workspace

A Cargo virtual workspace rooted at repository root:
- `crates/syntropy-core`: Blackboard, 4-tier hierarchy, Workstream DAG, 1-Hour Sprint
- `crates/syntropy-engine`: Rig.rs 0.42+ runtime, model routing, tools, circuit breakers
- `src-tauri`: Tauri 2.0 host, IPC router, paths, OAuth, OS Keystore

Root frontend:
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`
- `src/`: React 19, TypeScript, Tailwind CSS, Lucide icons, Zustand stores

---

## 2. Detailed Component Breakdown

### 2.1 `crates/syntropy-core`
- `src/lib.rs`: Module exports and prelude.
- `src/models.rs`:
  - `Tier`: Federation, Workstream, Team, Sme.
  - `AgentId`, `WorkstreamId`, `TeamId`, `ArtifactId`.
  - `SmeRole`, `SmeMetadata`, `TeamDefinition`, `WorkstreamDefinition`, `FederationDefinition`.
  - `WorkstreamStatus`: Pending, Running, Paused, AwaitingApproval, Completed, Failed.
  - `Milestone`: Title, description, phase, required_approvals, is_approved.
- `src/blackboard.rs`:
  - `ArtifactUri`: Parses `blackboard://{workstream_id}/{team_id}/{agent_id}/{artifact_name}@v{version}`.
  - `BlackboardArtifact`: URI, content, version, author_id, mime_type, tags, created_at, hash.
  - `BlackboardStore`: Thread-safe `Arc<RwLock<...>>` in-memory vault with disk persistence to `app_data_dir/blackboard`.
  - `WriteAclGuard`: Enforces that only `agent_id` can write to `blackboard://.../{agent_id}/...`. Write mismatches yield `BlackboardError::WriteAccessDenied`.
  - Global read within the workstream boundary.
  - `BlackboardSignal`: Lightweight metadata notification containing URI, author, version, title, timestamp, and size ($O(1)$ token overhead) emitted on commit via `tokio::sync::broadcast`.
- `src/dag.rs`:
  - `WorkstreamDag`: Task nodes with dependencies, cycle detection, topological sort, concurrency levels.
  - Execution state tracking for SME tasks and phase transitions.
- `src/synthesis.rs`:
  - `AgentResult`: Structured output artifact produced by an SME.
  - `TeamPlan`: Compiled plan containing summary, action items, target files, execution sequence, and evaluated risks.
- `src/blueprints/sprint.rs`:
  - `OneHourSprintBlueprint`:
    - Phase 1: Understand & Map (00–15m) — Research SMEs ingest briefs & emit user journey maps.
    - Phase 2: Sketch & Ideate (15–30m) — Divergent SMEs generate multiple distinct architectures.
    - Phase 3: Decide & Storyboard (30–45m) — Evaluator SMEs critique; Team PM compiles executable `TeamPlan`.
    - Phase 4: Prototype & Synthesize (45–60m) — Builder SMEs generate schemas, mockups, and validation briefs.

### 2.2 `crates/syntropy-engine`
- `src/lib.rs`: Module exports.
- `src/providers.rs`:
  - Provider enum: `Gemini`, `Anthropic`, `OpenAI`, `Groq`.
  - Unified client setup driven by API keys from keystore/env.
- `src/routing.rs`:
  - `ModelTier`: `SmeFast` (90% tier, e.g., `gemini-2.5-flash`, `llama-3.3-70b-versatile`) vs `ReasoningLead` (10% tier, e.g., `gemini-2.5-pro`, `claude-3-7-sonnet`).
  - `ModelRouter`: Inspects task context, role, and complexity to assign optimal model.
- `src/resilience.rs`:
  - `CircuitBreaker`: 3 states (`Closed`, `Open`, `HalfOpen`).
  - Trips to `Open` after 3 consecutive failures.
  - Half-open canary probing after cooldown.
  - Exponential backoff with randomized jitter on HTTP 429 / 503 (1s, 2s, 4s, 8s + jitter).
- `src/tools/mod.rs`:
  - Native `rig::tool::Tool` implementations with `schemars` JSON schemas.
  - `SecurityFilter`: Deterministic tool validator stripping destructive operations (`delete_message`, `trash_message`, `purge`, `drop_table`, `rm`) before exposing manifests to LLMs.
  - MCP client connector structure.

### 2.3 `src-tauri`
- `src/main.rs` and `src/lib.rs`: Tauri application initialization.
- `src/paths.rs`: Cross-platform path resolution using `dirs` and Tauri's native `PathResolver`:
  - Windows: `AppData/Local/Programs/syntrophyOS`, `AppData/Roaming/syntrophyOS`, `~/.syntrophyOS/extensions`
  - macOS: `/Applications/syntrophyOS.app`, `~/Library/Application Support/syntrophyOS`, `~/.syntrophyOS/extensions`
  - Linux: `/opt/syntrophyOS`, `~/.config/syntrophyOS`, `~/.syntrophyOS/extensions`
  - Auto-creates directories on application boot.
- `src/protocol.rs`:
  - Serde commands: `LaunchWorkstream`, `PauseWorkstream`, `ApproveMilestone`, `ReadBlackboard`, `SaveApiKey`, `GetSystemStatus`, `CalibrateFta`.
  - Serde events: `SmeTaskStarted`, `ArtifactPublished`, `TeamPlanSynthesized`, `ToolApprovalRequest`, `WorkstreamCompleted`, `TokenStream`.
- `src/oauth.rs`:
  - Ephemeral local HTTP listener on `127.0.0.1:8989/oauth/callback`.
  - PKCE challenge generation, state validation, authorization code capture.
- `src/keystore.rs`:
  - Secure credential storage using `keyring` (Windows DPAPI, macOS Keychain).
  - Wrap secrets in `zeroize::Zeroizing<String>` to scrub memory on drop.

### 2.4 `src/` (Frontend)
- `src/types/protocol.ts`: Field-for-field synchronized TypeScript types with `snake_case` serialization.
- `src/stores/`:
  - `useWorkstreamStore.ts`: Workstreams, active tasks, blackboard artifacts, approval requests.
  - `useFtaStore.ts`: FTA hours saved counter, calibration score, sprint logs.
  - `useSettingsStore.ts`: API keys, OAuth status, OS paths.
- `src/components/`:
  - `WindowChrome.tsx`: Custom frameless window drag region, minimize, maximize, close controls.
  - `ApprovalModal.tsx`: HITL Tool approval modal (1-click Approve / Reject with parameter diff).
  - `FtaCounter.tsx`: Real-time labor hours counter with interactive 1-5 star calibration widget.
  - `TypewriterStream.tsx`: Token chunk streamer for active SME chat cards.
- `src/views/`:
  - `WorkstreamHub.tsx`: Blueprint library cards (1-Hour Agentic Sprint) and active runs.
  - `ExecutionBoard.tsx`: Visual Kanban board mapping the 4-tier hierarchy (`Federation > Workstream > Team > SME`).
  - `ArtifactTimeline.tsx`: Versioned document viewer with markdown rendering and diff inspection.
  - `SettingsHub.tsx`: Provider keys, path checks, and OAuth account status.

---

## 3. Strict Engineering Constraints Check
- `protocol.rs` and `protocol.ts` synchronized 1:1 in `snake_case`.
- Zero CLI/terminal bloat (`reedline`, `crossterm` excluded).
- Zero mock stubs — live Rig engine executions, circuit breaker, blackboard, and tools.
- Verification: `cargo check --workspace`, `cargo test --workspace`, `cargo clippy --workspace -- -D warnings`, `npm run build` or `npm run typecheck`.
