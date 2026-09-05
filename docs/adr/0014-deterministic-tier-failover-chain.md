# 14. Deterministic In-Tier Model Failover Chain

## Context
High-frequency agent federations executing 90% Fast-tier tasks frequently encounter transient provider rate limits (HTTP 429) or service outages (HTTP 503). Immediately aborting the sprint on a rate limit creates unnecessary friction for managers.

## Decision
The 90/10 asymmetric model router implements a deterministic in-tier failover chain (`gemini-2.5-flash` $\rightarrow$ `llama-3.3-70b` on Groq $\rightarrow$ local Ollama) before declaring failure. The Circuit Breaker trips to `Open` only after all available providers in that performance tier fail or exceed retry backoffs.

## Consequences
Autonomous sprints continue uninterrupted during temporary API brownouts while keeping the system within its allocated latency and cost profile.
