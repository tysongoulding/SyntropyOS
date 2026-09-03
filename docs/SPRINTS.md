# SPRINTS.md — The Agentic Sprint Framework & Blueprints

The **Agentic Sprint Framework** in SyntropyOS defines time-boxed, phase-gated execution blueprints that drive multi-agent swarms toward concrete business deliverables under deterministic service-level agreements (SLAs).

---

## 1. Motivation: Eliminating Chaos in Autonomous Workflows

Unconstrained autonomous agents typically suffer from three fundamental failure modes:
1. **Scope Creep & Infinite Loops**: Agents continue searching, tweaking, or rewriting without a hard termination boundary.
2. **Conversation Bloat**: Cumulative prompt token accumulation leads to degraded reasoning and forgotten instructions.
3. **Premature Convergence**: Agents agree on early, sub-optimal proposals without divergent exploration.

The Agentic Sprint framework mitigates these failure modes by dividing initiatives into strictly scheduled, role-bound phases that communicate exclusively through immutable Blackboard artifacts.

---

## 2. The Flagship 1-Hour Sprint Blueprint

The primary blueprint implemented in `crates/syntropy-core/src/blueprints/sprint.rs` is the **1-Hour Autonomous Agentic Sprint**, divided into 4 sequential 15-minute phases:

| Phase | Time Window | Focus & Directives | Assigned Agents | Required Blackboard Artifacts |
|---|---|---|---|---|
| **Phase 1: Understand & Map** | 00–15m | Ingest user brief, extract domain entities, and establish customer journey maps. | `sme_research`, `sme_user_advocate` | `user_journey_map`, `domain_entities` |
| **Phase 2: Sketch & Ideate** | 15–30m | Divergent exploration generating competing architectural and UI/UX candidates. | `sme_architect`, `sme_designer` | `solution_candidates`, `interaction_flows` |
| **Phase 3: Decide & Storyboard** | 30–45m | Critical trade-off analysis, technical feasibility scoring, and convergence on the target path. | `sme_evaluator`, `team_pm` | `decision_matrix`, `sprint_storyboard` |
| **Phase 4: Prototype & Synthesize** | 45–60m | Working code implementation, automated test coverage, and delivery synthesis. | `sme_builder`, `sme_qa` | `prototype_code`, `test_results`, `team_plan` |

---

## 3. Blueprint Data Architecture

The blueprint schema is statically defined and validated in Rust:

```rust
// crates/syntropy-core/src/blueprints/sprint.rs

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SprintPhase {
    UnderstandAndMap,       // 00–15m
    SketchAndIdeate,        // 15–30m
    DecideAndStoryboard,    // 30–45m
    PrototypeAndSynthesize, // 45–60m
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SprintPhaseConfig {
    pub phase: SprintPhase,
    pub title: String,
    pub description: String,
    pub duration_minutes: u32,
    pub assigned_smes: Vec<String>,
    pub required_artifacts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OneHourSprintBlueprint {
    pub id: String,
    pub name: String,
    pub phases: Vec<SprintPhaseConfig>,
}
```

---

## 4. Phase Transition & Quality Gates

Transitions between sprint phases are deterministic and non-negotiable:

1. **Artifact Completeness Gate**:
   A phase cannot advance until all items in `SprintPhaseConfig::required_artifacts` have been published to the Blackboard and verified by `BlackboardStore::get()`.
2. **ACL Namespace Validation**:
   Published artifacts must originate from the assigned SMEs (`WriteAclGuard`), preventing unauthorized phase tampering.
3. **Hard SLA Timeout**:
   If an SME encounters an unrecoverable error or rate limit, the circuit breaker trips, allowing the Team Lead agent to either fall back to an alternate model tier or synthesize partial results before the 15-minute window expires.

---

## 5. Integration with the Orchestration Layer

While `SPRINTS.md` governs the temporal workflow and phase blueprints, the underlying mechanics are provided by:
* **Blackboard Store**: Storing versioned artifacts (`blackboard://...`) as described in [ORCHESTRATION.md](ORCHESTRATION.md).
* **DAG Engine**: Scheduling tasks with Kahn's topological sort as described in [ORCHESTRATION.md](ORCHESTRATION.md).
* **Asymmetric Routing**: Allocating 90% fast models to SME phases and 10% deep reasoning to phase decision gates.
