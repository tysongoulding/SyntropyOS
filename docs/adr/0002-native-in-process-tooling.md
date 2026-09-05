# 2. Native In-Process Rust Tooling Over MCP

## Context
Model Context Protocol (MCP) requires external process boundaries, JSON-RPC serialization, and verbose JSON Schema definitions that consume thousands of prompt tokens and introduce IPC latency on high-frequency agent loops.

## Decision
All core and domain tools in SyntropyOS run as native in-process Rust functions compiled directly inside `syntropy-engine`. MCP is rejected for internal tooling to maintain microsecond execution speeds and eliminate prompt token bloat.

## Consequences
New internal tools must be implemented in Rust or lightweight embedded runtimes rather than running separate external MCP server processes.
