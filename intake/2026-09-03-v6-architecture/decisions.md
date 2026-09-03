# Architectural Decisions — SyntropyOS V6 Architecture

- **Date:** 2026-09-03
- **Status:** APPROVED & PINNED

## DEC-001: Pure Desktop Tauri 2.0 + Rig.rs Native Architecture
- **Decision:** Pure desktop application using Tauri 2.0 native bindings and Rig.rs 0.42+ Rust engine.
- **Rationale:** Eliminate CLI/terminal bloat (`reedline`, `crossterm`) and provide an enterprise desktop experience for non-technical managers with high performance, local security, and low memory overhead.
- **Status:** `DECIDED`

## DEC-002: Asymmetric 90/10 Model Routing
- **Decision:** Route 90% of SME tasks (data parsing, tool calls, regex, drafting) to high-throughput cost-effective models (`gemini-2.5-flash`, `groq-llama3`), and 10% of synthesis/lead tasks to frontier reasoning models (`gemini-2.5-pro`, `claude-3-7-sonnet`).
- **Rationale:** Maximizes throughput and cost-efficiency while ensuring flawless multi-agent synthesis and conflict resolution.
- **Status:** `DECIDED`

## DEC-003: Versioned Blackboard with Author Write Isolation
- **Decision:** Blackboard store implements immutable versioned entries identified by deterministic URIs: `blackboard://{workstream_id}/{team_id}/{agent_id}/{artifact_name}@v{version}`. Write operations require agent ID matching the URI namespace; mismatches yield `403 WriteAccessDenied`.
- **Rationale:** Prevents context corruption, eliminates groupthink hallucination loops, and ensures an auditable tamper-resistant artifact trail.
- **Status:** `DECIDED`

## DEC-004: Hardware-Level Keystore & Zeroize Hygiene
- **Decision:** Refresh tokens stored securely in OS credential vaults (Windows DPAPI, macOS Keychain) via `keyring-rs`. In-memory access tokens wrapped in `zeroize::Zeroizing<String>`.
- **Rationale:** Enterprise credential hygiene preventing plain-text memory scraping or file leakage.
- **Status:** `DECIDED`

## DEC-005: 3-State Fault-Tolerant Circuit Breaker with Jitter
- **Decision:** Circuit breaker wraps LLM providers and MCP tools with `Closed`, `Open`, `HalfOpen` states. Consecutive 3 failures trip to Open. Exponential backoff (1s, 2s, 4s, 8s + random jitter) applied on 429/503.
- **Rationale:** Protects provider rate limits and guarantees self-healing resilience during high-concurrency sprints.
- **Status:** `DECIDED`

## DEC-006: Deterministic Tool Security Filter
- **Decision:** Strip destructive tools matching blacklist patterns (`delete_message`, `trash_message`, `purge`, `drop_table`, `rm`) before exposing tool manifests to LLM agents. HITL approval required for external mutation tools.
- **Rationale:** Zero accidental data loss or unauthorized mutation without explicit manager confirmation.
- **Status:** `DECIDED`
