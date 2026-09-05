# 5. Role-Scoped Just-In-Time (JIT) Tool Injection

## Context
Exposing all native tools to every agent in every prompt consumes thousands of tokens per request and increases the attack surface for accidental or hallucinated tool execution.

## Decision
Agents receive tool manifests filtered dynamically by tier and current sprint phase. Strategic leads during planning receive read-only and synthesis tools, while code-generation tools are injected strictly to Fast-tier SMEs during the `Prototype` phase.

## Consequences
Prompt sizes for tool definitions drop under 500 tokens, lowering latency and reinforcing phase-boundary isolation.
