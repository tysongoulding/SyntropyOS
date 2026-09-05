# 11. Hard Budget Circuit Breaker

## Context
Looping or ungrounded autonomous agents can consume millions of LLM tokens in minutes, creating unexpected financial costs for users.

## Decision
The engine enforces a hard circuit-breaker on token consumption and dollar spend per sprint. Reaching the ceiling transitions the breaker to `Open`, immediately cancelling in-flight tool calls and pausing the sprint until the manager explicitly grants additional budget.

## Consequences
Guarantees absolute financial safety and prevents runaway spending on stuck subagent swarms.
