# Contributing to SyntropyOS

Thank you for your interest in contributing to **SyntropyOS**! We welcome contributions from human engineers and autonomous AI agents alike.

---

## 🏛️ Core Principles

1. **Evidence First & Verification Gates**: No pull request is merged without green tests (`cargo test --workspace`), zero Clippy lints (`cargo clippy --workspace -- -D warnings`), and a passing production bundle build (`npm run build`).
2. **Contract-First Synchronization**: Changes to backend types in `src-tauri/src/protocol.rs` must be mirrored field-for-field in `src/types/protocol.ts` in `snake_case`.
3. **Zero Hardcoded Secrets**: Scans for API keys, tokens, or credential strings must always return zero matches. Use `SecureKeystore` backed by the OS keyring and `zeroize::Zeroizing<String>`.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Rust (1.80+)**: Installed via `rustup`
- **Node.js (20+) & npm**: For the React 19 frontend
- **Tauri CLI 2.0**: Included in `devDependencies`

### 2. Quickstart
```powershell
# Clone the repository
git clone https://github.com/tysongoulding/SyntropyOS.git
cd SyntropyOS

# Install dependencies
npm install

# Run the native desktop application in development mode
npm run tauri dev
```

---

## 🌿 Branch & Commit Guidelines

- **Branch Naming**:
  - `feature/<description>` for new capabilities
  - `fix/<description>` for bug fixes
  - `docs/<description>` for documentation updates
- **Commit Messages**: Follow conventional commit formats:
  - `feat: add 4-tier model router canary check`
  - `fix: resolve blackboard write isolation error handling`
  - `docs: update backend API specifications`

---

## 🧪 Mandatory Verification Checklist

Before submitting a Pull Request, run the following verification commands locally:

```powershell
# 1. Run all workspace unit and integration tests
cargo test --workspace

# 2. Run Clippy across the entire workspace
cargo clippy --workspace -- -D warnings

# 3. Verify frontend TypeScript types and build production bundle
npm run build
```

---

## 📄 Documentation Reference

- **[AGENTS.md](AGENTS.md)**: AI agent rules, architecture boundaries, and execution rules.
- **[BACKEND.md](docs/BACKEND.md)**: Rust crates, Rig.rs engine, and Blackboard store specifications.
- **[FRONTEND.md](docs/FRONTEND.md)**: React 19 architecture, Zustand stores, and tri-color theme tokens.
- **[SPEC.md](SPEC.md)**: Active deliverable backlog and delivery checklist.
