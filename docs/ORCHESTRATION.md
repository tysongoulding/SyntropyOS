# ORCHESTRATION.md — Agent Federation & Orchestration Guide

The **Orchestration Plane** (or *Agent Federation Fabric*) is the cognitive operating system of SyntropyOS. It governs how autonomous agent swarms collaborate, communicate, and synthesize plans without suffering from **conversation context cascading** or **groupthink**.

---

## 1. The 4-Tier Federation Hierarchy

SyntropyOS enforces a strict, top-down governance topology:

```text
┌────────────────────────────────────────────────────────┐
│                   TIER 1: FEDERATION                   │
│          Global enterprise boundaries & policy         │
└───────────────────────────┬────────────────────────────┘
                            │ Contains 1..N
┌───────────────────────────▼────────────────────────────┐
│                  TIER 2: WORKSTREAM                    │
│      A business initiative, project, or sprint SLA     │
└───────────────────────────┬────────────────────────────┘
                            │ Contains 1..N
┌───────────────────────────▼────────────────────────────┐
│                    TIER 3: TEAM                        │
│    Cross-functional unit led by a PM / Lead Agent      │
└───────────────────────────┬────────────────────────────┘
                            │ Dispatches 1..N
┌───────────────────────────▼────────────────────────────┐
│                    TIER 4: SME                         │
│  Subject Matter Expert Agents (Research, Arch, Code)   │
└────────────────────────────────────────────────────────┘
```

* **Federation**: The root organization container managing global token budgets and enterprise keystores.
* **Workstream**: A goal-oriented initiative bound to a specific blueprint (e.g. `1hour-sprint`) and SLA timeline.
* **Team**: A cross-functional group led by a **Reasoning Lead** agent (10% Tier) responsible for synthesis and evaluation.
* **SME (Subject Matter Expert)**: Focused, stateless execution agents (90% Tier) specialized in discovery, drafting, linting, or code transformations.

---

## 2. The Decoupled Blackboard Store

Traditional agent swarms pass cumulative chat history between agents. In SyntropyOS, **agents never see raw peer chat history**. Instead, all collaboration is mediated via the **Blackboard Store**.

### Deterministic URI Scheme
Every artifact created by an agent is addressed by a globally unique, immutable URI:

```text
blackboard://{workstream_id}/{team_id}/{agent_id}/{artifact_name}@v{version}
```

* **Example**: `blackboard://ws-sprint-104/team-research/sme_research/user_journey@v1`

### Zero-Trust Author Write ACLs (`WriteAclGuard`)
To prevent rogue mutations or race conditions:
1. An agent may only write to URIs where `uri.agent_id == caller_agent_id`.
2. The payload's `artifact.author_id` must match `caller_agent_id`.
3. Any unauthorized write attempt immediately halts with:
   ```text
   403 WriteAccessDenied: caller 'sme_arch' cannot mutate 'sme_research' namespace
   ```

### O(1) Signal Broadcast Bus
When an agent publishes an artifact, the Blackboard does **not** broadcast the content payload. Instead, it emits a lightweight `BlackboardSignal` containing only metadata:
* `uri`, `author_id`, `title`, `version`, `content_hash` (SHA-256), `size_bytes`.

Peer agents listen to the signal bus over `tokio::sync::broadcast` and retrieve the artifact body on-demand, maintaining **O(1) token overhead**.

---

## 3. The Flagship 1-Hour Agentic Sprint Blueprint

The flagship blueprint is a rigid 60-minute SLA divided into 4 sequential 15-minute phases:

| Phase | Time Window | Focus | Agents Active | Primary Output |
|---|---|---|---|---|
| **Phase 1: Understand & Map** | 00–15m | Ingest directives, map user journeys, extract entities. | `sme_research` | `user_journey@v1` |
| **Phase 2: Sketch & Ideate** | 15–30m | Parallel architectural sketches & schema drafts. | `sme_architect`, `sme_designer` | `arch_sketch@v1` |
| **Phase 3: Decide & Storyboard** | 30–45m | Critical trade-off analysis and decision matrix. | `team_lead`, `sme_evaluator` | `decision_matrix@v1` |
| **Phase 4: Prototype & Synthesize** | 45–60m | Working code implementation, tests, and synthesis. | `sme_builder`, `sme_qa` | `TeamPlan@v1` |

---

## 4. Task DAG Engine & Cycle Detection

Workstream task dependencies are represented as a Directed Acyclic Graph (DAG):

1. **Cycle Detection**: Validated on task insertion using Depth-First Search (`detect_cycle()`). Circular dependencies are rejected immediately.
2. **Kahn's Topological Sort**: Resolves task readiness in $O(V + E)$ time. Tasks with in-degree 0 are scheduled for parallel execution across the threadpool.

```rust
// syntropy-core/src/dag.rs
let mut dag = WorkstreamDag::new();
dag.add_task(task_map);
dag.add_task(task_sketch);
dag.add_dependency(&task_sketch.id, &task_map.id); // sketch depends on map

let execution_order = dag.topological_sort()?;
```

---

## 5. 90/10 Asymmetric Model Routing

SyntropyOS routes model prompts asymmetrically to optimize throughput, speed, and cost:

* **90% SME Tier (`SmeFast`)**:
  * Models: `gemini-2.5-flash`, `llama-3.3-70b-versatile`
  * Tasks: Regex parsing, AST traversal, tool invocation, draft writing.
  * SLA: Low latency (< 1s first token), high token budget.
* **10% Reasoning Lead Tier (`ReasoningLead`)**:
  * Models: `gemini-2.5-pro`, `claude-3-7-sonnet`
  * Tasks: Plan synthesis, architectural reviews, decision gates, ambiguous trade-offs.
  * SLA: Extended thinking budget, high reasoning depth.

---

## 6. Plan Synthesis (`AgentResult` → `TeamPlan`)

At the conclusion of a workstream phase, the Team Lead aggregates the discrete `BlackboardArtifact` pointers and compiles them into a structured `TeamPlan`:

```text
┌─────────────────────────┐    ┌─────────────────────────┐
│   AgentResult (SME 1)   │    │   AgentResult (SME 2)   │
│   blackboard://...@v1   │    │   blackboard://...@v1   │
└────────────┬────────────┘    └────────────┬────────────┘
             │                              │
             └──────────────┬───────────────┘
                            ▼
           ┌─────────────────────────────────┐
           │   Reasoning Lead Synthesizer    │
           │     crates/syntropy-core        │
           └────────────────┬────────────────┘
                            ▼
           ┌─────────────────────────────────┐
           │     Structured TeamPlan         │
           │  • milestones, risks, actions   │
           │  • verified against test plan   │
           └─────────────────────────────────┘
```
