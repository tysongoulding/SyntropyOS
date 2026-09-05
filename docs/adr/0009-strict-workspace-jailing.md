# 9. Strict Workspace Path Jailing

## Context
Autonomous agents executing file tools or shell commands could inadvertently read or overwrite sensitive files outside the project repository (e.g. `C:\Windows`, `~/.ssh`, `~/.bashrc`).

## Decision
All native file operations and command working directories must be canonicalized and validated to ensure they reside strictly within the project workspace root. Any attempt to traverse out via `..` or absolute paths outside the root triggers an immediate execution abort.

## Consequences
Agents operate in a zero-trust filesystem jail without requiring heavy container virtualization.
