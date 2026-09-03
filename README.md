# SyntropyOS

[![Build & Test Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/tysongoulding/SyntropyOS)
[![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app)
[![Rig.rs 0.42+](https://img.shields.io/badge/Rig.rs-0.42+-orange.svg)](https://rig.rs)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**SyntropyOS** is a native desktop operating system for autonomous agent federations. It enables non-technical department managers to deploy, govern, and collaborate with autonomous, 4-tier agent swarms using a decoupled, versioned **Blackboard Store**, enterprise OAuth 2.0 loopback authentication, and a real-time **Full-Time Agent (FTA)** ROI valuation framework.

---

## 🎯 Purpose & Mission

Modern agent systems suffer from **conversation context cascading** (where entire prompt transcripts are piped linearly between agents, compounding latency, hallucinations, and token cost) and **groupthink** (where subagents passively agree with earlier agent outputs).

SyntropyOS solves this with an enterprise-first native architecture:
1. **Zero-Trust Blackboard Store**: Agents read inputs and write outputs to isolated, versioned URIs (`blackboard://...`). Write permissions are restricted strictly to author agents ($O(1)$ token signal broadcast).
2. **4-Tier Federation Hierarchy**: Top-down governance model: `Federation` $\rightarrow$ `Workstream` $\rightarrow$ `Team` $\rightarrow$ `SME`.
3. **90/10 Asymmetric Model Routing**: 90% of tasks run on high-throughput, low-cost SME models (`gemini-2.5-flash`, `llama-3.3-70b`), while 10% of synthesis and review runs on frontier reasoning models (`gemini-2.5-pro`, `claude-3-7-sonnet`).
4. **Full-Time Agent (FTA) Valuation**: Quantifies autonomous labor hours delivered, cost-per-output, and dollar ROI calibrated against a 1–5 star manager rating scale.
5. **Pure Native Engine**: Powered directly by **Tauri 2.0** and **Rig.rs 0.42+** in Rust, with zero Python runtimes, zero terminal overhead, and zero unvetted dependencies.

---

## 📦 Download Compiled Applications

Pre-compiled production binaries for Windows, macOS, and Linux are published on GitHub Releases:

👉 **[Download Latest SyntropyOS Release](https://github.com/tysongoulding/SyntropyOS/releases/latest)**

| Platform | Installer Type | Package |
|---|---|---|
| **Windows (x64)** | `.msi` / `.exe` | `SyntropyOS_x64_en-US.msi` / `SyntropyOS-setup.exe` |
| **macOS (Universal / Apple Silicon)** | `.dmg` / `.app` | `SyntropyOS_universal.dmg` |
| **Linux (x64 / ARM64)** | `.AppImage` / `.deb` | `syntropyos_amd64.AppImage` / `syntropyos_amd64.deb` |

---

## ⚡ Single-Line Quick Install

### Windows (PowerShell)
```powershell
irm https://github.com/tysongoulding/SyntropyOS/releases/latest/download/install.ps1 | iex
```

### Linux (Bash / Curl)
```bash
curl -fsSL https://github.com/tysongoulding/SyntropyOS/releases/latest/download/install.sh | bash
```

### macOS (Terminal)
```bash
curl -fsSL https://github.com/tysongoulding/SyntropyOS/releases/latest/download/install-mac.sh | bash
```

---

## 🛠️ Building From Source

### Prerequisites
* **Rust** (1.80+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
* **Node.js** (20.x+) & **npm**: [nodejs.org](https://nodejs.org)
* **Tauri CLI 2.0**: Included via project `devDependencies`

### Local Development
```powershell
# 1. Clone repository
git clone https://github.com/tysongoulding/SyntropyOS.git
cd SyntropyOS

# 2. Install frontend dependencies
npm install

# 3. Launch native desktop dev environment (Tauri 2.0 + Rust Engine + React 19)
npm run tauri dev
```

### Run Tests & Validation Suite
```powershell
# Run backend Rust test suite (15 unit/integration tests)
cargo test --workspace

# Run Rust linter (zero-warning policy)
cargo clippy --workspace -- -D warnings

# Run frontend typecheck & production bundle build
npm run build
```

---

## 🏛️ System Architecture

```text
SyntropyOS
├── crates/syntropy-core        <-- Blackboard Store (ACLs), DAG engine, 4-tier models, Sprint blueprints
├── crates/syntropy-engine      <-- Rig.rs 0.42+ client, 90/10 asymmetric router, 3-state circuit breaker
├── src-tauri                   <-- Tauri 2.0 host, hardware keystore (keyring), OAuth loopback, paths
└── src/                        <-- React 19 + Tailwind + Lucide desktop UI, Tri-Color theme, Kanban board
```

See [AGENTS.md](AGENTS.md), [BACKEND.md](BACKEND.md), and [FRONTEND.md](FRONTEND.md) for architectural references and developer guides.
