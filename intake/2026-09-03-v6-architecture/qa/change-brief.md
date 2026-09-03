# Change Brief — SyntropyOS V6 Architecture

- **Author:** `qa-triage`
- **Date:** 2026-09-03
- **Input Source:** `intake/2026-09-03-v6-architecture/technical-plan.md`
- **Scope:** Greenfield implementation of SyntropyOS desktop platform across Rust workspace crates and TypeScript frontend.

## 1. Surfaces Touched
- `crates/syntropy-core`: Data models, BlackboardStore, author ACLs, signal bus, DAG engine, plan synthesis pipeline, 1-Hour Sprint blueprint.
- `crates/syntropy-engine`: Multi-provider Rig.rs clients, 90/10 model routing, 3-state circuit breaker with jitter backoff, tool system, deterministic security filter.
- `src-tauri`: Tauri 2.0 host, path resolution, deterministic IPC protocol, OAuth PKCE loopback, hardware keystore with zeroize.
- `src/`: React 19 desktop GUI, TypeScript protocol types, Zustand stores, Workstream Hub, Kanban Execution Board, Artifact Timeline, Settings Hub, HITL modal, FTA counter.

## 2. Invariants at Risk & Test Requirements
- **Write ACL Security:** Agent A cannot write to Agent B's namespace; must strictly error with `WriteAccessDenied`.
- **Blackboard URI Grammar:** Invalid URIs must be rejected on parse.
- **Circuit Breaker:** State transitions `Closed -> Open -> HalfOpen -> Closed` must strictly adhere to failure thresholds, canary probing, and backoff jitter limits.
- **Destructive Tool Filtering:** Blacklisted operations must never be exposed in tool manifests.
- **Protocol Parity:** Field names and JSON structures in `src-tauri/src/protocol.rs` must match `src/types/protocol.ts`.
- **Zeroize Memory Hygiene:** Sensitive memory scrubbed on drop.

## Verdict
**READY**
