# Security Policy

The SyntropyOS project takes the security of autonomous agent execution, secret management, and local system environments seriously.

---

## 🛡️ Supported Versions

We release patches and security fixes for the latest active minor release:

| Version | Supported |
|---|---|
| `0.1.x` | :white_check_mark: Active |
| `< 0.1.0` | :x: End of Life |

---

## 🔒 Reporting a Vulnerability

If you discover a security vulnerability within **SyntropyOS**, please report it responsibly:

1. **Do NOT open a public GitHub issue.**
2. Report the vulnerability privately via **[GitHub Private Vulnerability Reporting](https://github.com/tysongoulding/SyntropyOS/security/advisories/new)**.
3. If GitHub Advisories are unavailable, email **security@syntropyos.com** or contact repository owner directly.

### What to Include
* A detailed summary of the vulnerability.
* Steps to reproduce, proof-of-concept code, or minimal reproduction scripts.
* Potential blast radius (e.g., local arbitrary code execution, token memory leakage, ACL bypass).
* Suggested remediation or patches, if known.

We aim to acknowledge reports within 48 hours and provide remediation timelines within 7 business days.

---

## 🏛️ Security Architecture Invariants

All contributors and AI agents must adhere to the following zero-tolerance invariants:

1. **Hardware Keystore & Zeroizing Memory**: API keys, tokens, and credentials must be stored exclusively in the OS hardware keystore (`keyring`) and scrubbed in RAM with `zeroize::Zeroizing<String>`.
2. **Blackboard Write Isolation**: Any write to `BlackboardStore::publish()` must match `caller_agent_id == uri.agent_id`. Bypassing `WriteAclGuard` is strictly forbidden.
3. **Deterministic Tool Filtering**: Tools containing destructive system commands (`rm`, `format_disk`, `drop_table`, `purge`, `delete_message`, `truncate`) are stripped from agent manifests via `SecurityFilter`.
4. **Shell Injection Prevention**: OS process spawning with string interpolation (`cmd /c start &url`) is prohibited. Use `tauri-plugin-opener` with protocol validation (`http://`, `https://`).
