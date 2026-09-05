# 10. Single-Writer Actor Channel for SQLite Blackboard

## Context
Concurrent SME agents writing versioned artifacts, ACL tags, and signal events simultaneously can cause SQLite write lock contention (`SQLITE_BUSY`) or thread starvation.

## Decision
All Blackboard write operations are routed through a Tokio `mpsc` channel handled by a single dedicated write actor task. Reads are serviced concurrently across a connection pool in `WAL` mode.

## Consequences
Write transactions commit sequentially with zero lock contention, while query and read throughput remain entirely non-blocking.
