# 1. Local-First Air-Gapped Harness Architecture

## Context
SyntropyOS orchestrates autonomous agent federations handling sensitive enterprise data and credentials. Hosting an open multi-tenant backend server creates data privacy liabilities, hosting costs, and security risks.

## Decision
SyntropyOS runs strictly as a local-first desktop application on user hardware. All swarms, Blackboard data, and API keys remain air-gapped within the local harness (protected via OS DPAPI/Keychain), communicating outbound only to configured LLM inference endpoints.

## Consequences
Multi-user collaboration occurs via explicit, user-initiated export adapters (e.g. Google Drive, GitHub) rather than a shared cloud server.
