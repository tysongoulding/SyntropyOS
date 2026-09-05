# 12. Reactive Task DAG Observability

## Context
When a 4-tier federation executes parallel tasks across multiple SME agents, a simple linear log stream fails to convey dependencies, bottlenecks, or overall sprint progress.

## Decision
The desktop UI renders sprint execution as an interactive, reactive Directed Acyclic Graph (DAG) with animated node state transitions (`Queued` $\rightarrow$ `Running` $\rightarrow$ `Verified`), complemented by a slide-out artifact inspector for instant Blackboard deliverable review.

## Consequences
Managers gain real-time structural visibility into swarm execution and can inspect intermediate deliverables without digging through raw logs.
