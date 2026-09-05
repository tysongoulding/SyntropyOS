# 8. Hybrid SQLite with Content-Addressed Blob Storage

## Context
Storing multi-megabyte binary assets (compiled binaries, images, archives) directly inside SQLite causes database bloat, slow backups, and lock contention on concurrent writes.

## Decision
The Blackboard Store uses a hybrid storage model: SQLite stores artifact metadata, author ACLs, event signals, and text/JSON deliverables, while binary artifacts (>1MB) are written to a local content-addressed directory (`blackboard/blobs/<sha256>`) referenced by hash in SQLite.

## Consequences
SQLite remains lean and responsive for rapid querying, while large binary artifacts benefit from filesystem caching and deduplication.
