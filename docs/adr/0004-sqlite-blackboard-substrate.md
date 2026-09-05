# 4. Embedded SQLite Substrate for Blackboard Store

## Context
A flat filesystem storage model for the Blackboard Store creates concurrency race conditions, inefficient version diffing, and poor querying capabilities across large agent federations and signal buses.

## Decision
The Blackboard Store persistence layer will migrate to an embedded SQLite database using JSONB columns for artifact payloads and indexed relational columns for author-isolated ACLs, URI routing, and sprint milestones.

## Consequences
The entire workspace state, artifact history, and event signals are stored in a single, transactional, portable `.syntropy` SQLite file with zero external database dependencies.
