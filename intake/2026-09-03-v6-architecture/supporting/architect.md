# Architect Assessment — SyntropyOS V6 Architecture

- **Role:** `intake-architect`
- **Date:** 2026-09-03
- **Focus:** System topology, data flow, security boundaries, performance bottlenecks

## 1. System Topology & Decoupling
```text
┌─────────────────────────────────────────────────────────────┐
│                   React 19 Desktop GUI                      │
│   (ShadCN UI, Tailwind, Lucide Icons, Zustand State Store)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Tauri 2.0 IPC (Commands & Events)
┌──────────────────────────────▼──────────────────────────────┐
│                    src-tauri Host Layer                     │
│  - IPC Router (WorkstreamCommand / WorkstreamEvent)         │
│  - PathResolver (cross-platform AppData/Config resolution)  │
│  - Enterprise OAuth 2.0 PKCE Loopback (127.0.0.1:8989)      │
│  - Hardware Keystore (Windows DPAPI / macOS Keychain)       │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
┌───────────────▼──────────────┐ ┌────────────▼───────────────┐
│     crates/syntropy-core     │ │   crates/syntropy-engine   │
│ - Versioned Blackboard Store │ │ - Rig.rs 0.42+ Provider Hub│
│ - Author Write ACLs          │ │ - Asymmetric 90/10 Routing │
│ - Broadcast Signal Bus       │ │ - 3-State Circuit Breaker  │
│ - 4-Tier Hierarchy DAG       │ │ - Native & MCP Tool System │
│ - 1-Hour Sprint Blueprint    │ │ - Destructive Tool Filter  │
└──────────────────────────────┘ └────────────────────────────┘
```

## 2. Key Architectural Invariants
1. **Zero Raw Transcript Passing:** Context flows strictly through typed Blackboard artifacts. Raw agent conversation logs are kept strictly internal to the agent execution harness.
2. **Author Write ACL Enforcement:** Write requests to `blackboard://{w}/{t}/{a}/{artifact}@v{v}` are validated against caller credentials: `caller_id == a`.
3. **Signal Bus Efficiency:** Notifications contain solely lightweight metadata pointers (`ArtifactUri`, author, title, version, summary) to ensure O(1) overhead.
4. **Resilience & Rate Limit Shielding:** Circuit breaker prevents cascade failures during rate limits (HTTP 429/503) with exponential backoff and jitter.
