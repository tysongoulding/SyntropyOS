# 3. Phase-Gated Human-in-the-Loop Governance

## Context
Fully autonomous multi-agent sprints risk wasting LLM token budgets and generating misaligned code or artifacts if an incorrect design decision is made early in the sprint lifecycle.

## Decision
SyntropyOS enforces synchronous Phase Gates by default during 1-Hour Sprints, halting before the `Prototype` phase for department manager sign-off. Blueprints can optionally enable an "Autonomous SLA" toggle for trusted, unattended workflows within strict token budgets.

## Consequences
Managers retain total oversight of synthesis and high-cost generation stages while maintaining the flexibility to run unattended batch sprints.
