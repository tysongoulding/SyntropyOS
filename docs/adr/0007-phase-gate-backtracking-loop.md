# 7. Phase Gate Backtracking Loop with Iteration Cap

## Context
When a human manager rejects a sprint deliverable at a Phase Gate, blindly aborting the sprint discards all preceding progress, while open-ended retrying risks runaway token consumption.

## Decision
Manager rejection triggers a backtrack transition to the antecedent sprint phase. The rejection rationale is injected as a high-priority interrupt signal into the Blackboard, and the sprint is capped at 2 backtrack iterations before requiring manual escalation.

## Consequences
Agents self-correct based on human feedback without risking indefinite spending loops.
