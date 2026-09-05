# SyntropyOS Domain Model

SyntropyOS is a local-first desktop agentic operating system that orchestrates 4-tier autonomous agent federations using a native Rust engine, Tauri 2.0 shell, and an embedded transactional Blackboard Store.

## Language

**Harness**:
The self-contained local native runtime executing all agent swarms, memory, and storage strictly on the user's workstation.
_Avoid_: Agent backend, server, cloud runner

**Blackboard Store**:
The versioned, author-isolated artifact repository governed by deterministic URIs (`blackboard://...`) and zero-trust write ACLs.
_Avoid_: Global state, shared memory, context bus

**Phase Gate**:
A synchronous Human-in-the-Loop checkpoint halting execution at defined sprint transitions until manager approval or rejection.
_Avoid_: Pause point, approval dialog, check-in

**Native In-Process Tool**:
A high-performance Rust function executing in-process inside the engine without external RPC or schema serialization overhead.
_Avoid_: MCP tool, external server, microservice

**Autonomous SLA**:
An opt-in execution mode allowing trusted sprint blueprints to bypass intermediate Phase Gates within strict token and time limits.
_Avoid_: Unsupervised mode, background cron, auto-pilot

**Deliverable**:
An immutable, signed artifact produced during a sprint phase that satisfies the blueprint schema and invariant rules.
_Avoid_: Output, result, response

**JIT Tool Injection**:
The dynamic compilation of prompt tool manifests scoped strictly to the agent's tier and active sprint phase.
_Avoid_: Static tool list, global functions, tool dump

**Persona Blueprint**:
A declarative specification defining an agent's role directives, deliverable contracts, and permitted native tool IDs without requiring binary recompilation.
_Avoid_: Agent prompt, system prompt file, bot config

**Phase Backtrack**:
The governed transition reversing a sprint to an antecedent phase upon manager rejection, injecting feedback as a high-priority steering signal.
_Avoid_: Retry, loop, redo

**Blob Store**:
The local content-addressed storage for large binary deliverables (>1MB) keyed by SHA-256 hash and indexed by SQLite metadata.
_Avoid_: Asset folder, temp directory, media cache

**Workspace Jailing**:
The path boundary guard ensuring all file operations and command execution reside strictly within the project repository root.
_Avoid_: Chroot, container jail, local sandbox

**Blackboard Write Actor**:
The dedicated Tokio channel loop processing serialized write transactions to SQLite, preventing concurrency locks and contention.
_Avoid_: DB thread, write worker, mutex connection

**Budget Circuit Breaker**:
The financial guard that immediately halts LLM requests and tool calls when token or dollar limits are reached.
_Avoid_: Cost limiter, quota check, usage alert

**Task DAG**:
The directed acyclic graph mapping milestone dependencies and live agent execution states in the UI.
_Avoid_: Pipeline chart, flowchart, progress bar

**Global Prompt Profile**:
The centralized prompt directive store in user AppData that uniformly governs agent personas and layered rules across all local workstreams.
_Avoid_: Workspace prompt, local override, custom config

**Failover Chain**:
The deterministic sequence of alternative model providers within the same tier invoked automatically upon HTTP 429 or 503 errors before tripping the circuit breaker.
_Avoid_: Model retry, load balancer, fallback loop
