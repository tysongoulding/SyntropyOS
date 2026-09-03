# ORCHESTRATION.md — Federation, Teams & Blackboard Inner Workings

The **Orchestration Plane** (or *Agent Federation Fabric*) is the cognitive operating system of SyntropyOS. It governs how autonomous agent swarms collaborate, communicate, and synthesize plans across individual agents, teams, and team-of-teams hierarchies without suffering from **conversation context cascading** or **groupthink**.

For temporal phase execution, time-boxed SLAs, and blueprint declarations, see **[SPRINTS.md](SPRINTS.md)**.

---

## 1. The 4-Tier Federation Hierarchy

SyntropyOS organizes autonomous execution into four strictly isolated governance tiers:

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

* **Federation**: The root organization container managing global token budgets, hardware keystores, and system-wide security constraints.
* **Workstream**: A goal-oriented initiative bound to a specific execution blueprint and SLA timeline.
* **Team**: A cross-functional unit directed by a **Reasoning Lead** agent (10% tier) responsible for validation, critique, and synthesis.
* **SME (Subject Matter Expert)**: Specialized, stateless execution agents (90% tier) focused on narrow analytical, architectural, or code transformation tasks.

---

## 2. The Decoupled Blackboard Store Inner Workings

Traditional agent swarms pass cumulative chat history between agents, causing catastrophic context window expansion, hallucinations, and prompt pollution. In SyntropyOS, **agents never inspect peer conversation transcripts**. All collaboration is mediated exclusively via the **Blackboard Store**.

### Deterministic URI Scheme
Every artifact emitted by an agent is addressed by an immutable, deterministic URI:

```text
blackboard://{workstream_id}/{team_id}/{agent_id}/{artifact_name}@v{version}
```

* **Example**: `blackboard://ws-sprint-104/team-research/sme_research/user_journey@v1`

### Zero-Trust Author Write ACLs (`WriteAclGuard`)
To prevent unauthorized data mutation, race conditions, or cross-agent prompt injection:
1. An agent may only write to URIs where `uri.agent_id == caller_agent_id`.
2. The payload's `artifact.author_id` must match `caller_agent_id`.
3. Any unauthorized write attempt immediately halts with:
   ```text
   403 WriteAccessDenied: caller 'sme_arch' cannot mutate 'sme_research' namespace
   ```

### O(1) Signal Broadcast Bus
When an agent publishes an artifact, the Blackboard does **not** broadcast the content payload. Instead, it emits a lightweight `BlackboardSignal` containing only metadata:
* `uri`, `author_id`, `title`, `version`, `content_hash` (SHA-256), `size_bytes`.

Peer agents subscribe to the signal bus over `tokio::sync::broadcast` and pull artifact content on-demand, preserving strict **O(1) token overhead**.

---

## 3. Agent-to-Agent & Team-of-Teams Inner Workings

The orchestration layer coordinates work across two critical communication boundaries:

### Agent-to-Agent (Intra-Team)
Within a single team, Subject Matter Experts operate in parallel isolation:
* **Blind Discovery**: Multiple SMEs analyze the same problem without seeing peer intermediate prompts. This eliminates confirmation bias and premature consensus.
* **Pull-Based Context**: An SME requiring prior context requests specific artifact URIs from the Blackboard instead of loading conversational history.
* **Lead Mediation**: The Team Lead monitors published signals, verifies that required artifacts conform to schemas, and triggers downstream task readiness.

### Team-of-Teams (Inter-Team & Workstream Federation)
When scaling across complex enterprise projects, multiple teams run concurrently within a Workstream:
* **Federated Namespaces**: Teams communicate through published interfaces in the Blackboard hierarchy:
  `blackboard://{workstream_id}/{team_a}/...` $\leftrightarrow$ `blackboard://{workstream_id}/{team_b}/...`
* **Lead-to-Lead Crosswalks**: Team Leads exchange synthesized `TeamPlan` and architecture contracts rather than raw SME outputs, keeping cross-team context tight and focused.
* **Global Workstream Alignment**: The Workstream coordinator tracks overall milestone velocity and dependency fulfillment across all sub-teams using the DAG engine.

---

## 4. Task DAG Engine & Cycle Detection

Workstream task dependencies are represented as a Directed Acyclic Graph (DAG):

1. **Cycle Detection**: Validated on task insertion using Depth-First Search (`detect_cycle()`). Circular dependencies are rejected immediately with descriptive path errors.
2. **Kahn's Topological Sort**: Resolves task readiness in O(V + E) time. Tasks with in-degree 0 are scheduled for parallel execution across the Tokio threadpool.

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

At the conclusion of a workstream milestone, the Team Lead aggregates the discrete `BlackboardArtifact` pointers and compiles them into a structured `TeamPlan`:

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
