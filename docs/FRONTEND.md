# FRONTEND.md — Frontend Architecture & Design Guide

SyntropyOS Desktop UI is built on **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**, hosted within **Tauri 2.0**.

---

## 🎨 1. Theme Tokens & Styling System

The application uses an electric tri-color theme derived from the hero identity gradient:

| Token | Hex / Class | Primary Use |
|---|---|---|
| **Left** | `#58a6ff` (`blue-400`) | Primary action buttons, active navigation indicators, SME Fast tier chips (`90% Fast Tier`). |
| **Middle** | `#c084fc` (`purple-400`) | Reasoning Lead tier badges (`10% Reasoning Lead`), section headers, mid-tone gradient transitions. |
| **Right** | `#f472b6` (`pink-400`) | Real-time FTA ROI valuation counters, high-priority status badges, milestone completion flags. |
| **Hero Gradient** | `bg-gradient-to-r from-[#58a6ff] via-purple-400 to-pink-400` | Header brand logo, Home Hero greeting, and sprint deployment card accents. |
| **Surface Dark** | `#0d1117` / `#161b22` / `#21262d` | GitHub dark canvas, card containers, and modal surfaces. |
| **Border Dark** | `#30363d` | Universal subtle divider and card borders. |

---

## 📐 2. Shell Layout Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Titlebar.tsx: Logo (White Zap in Gradient), Status Pill, Window Controls│
├──────────────┬──────────────────────────────────────────┬──────────────┤
│              │ Main View Area:                          │              │
│ Sidebar.tsx: │  - `chat`: HomeHeroView / MessageFeed    │ Streaming-   │
│  - New Chat  │  - `workstreams`: WorkstreamsView        │ Workbench:   │
│  - Views Nav │  - `artifacts`: ArtifactsView            │  - Diffs     │
│  - Agents    │  - `customise`: CustomiseView            │  - File tree │
│  - FTA ROI   │  - `automation`: AutomationView          │  - JSON      │
│  - Settings  │  - `settings`: SettingsHubView           │              │
├──────────────┴──────────────────────────────────────────┴──────────────┤
│ Statusbar.tsx: Working Dir, Git Branch, Telemetry, Command Palette     │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
- [`src/components/layout/Titlebar.tsx`](../src/components/layout/Titlebar.tsx): Frameless window header with `data-tauri-drag-region`, status pill, and window controls (`minimize`, `maximize`, `close`).
- [`src/components/layout/Sidebar.tsx`](../src/components/layout/Sidebar.tsx): Primary view navigation, agent threads, search, and real-time Full-Time Agent (FTA) ROI badge.
- [`src/components/layout/Statusbar.tsx`](../src/components/layout/Statusbar.tsx): Bottom bar reporting current working directory (`cwd`), git branch, telemetry, and quick command palette trigger (`Ctrl+K`).
- [`src/components/workbench/StreamingWorkbench.tsx`](../src/components/workbench/StreamingWorkbench.tsx): Collapsible right-hand inspector with syntax-highlighted diffs, token gauges, and live JSON inspector.

---

## 🗄️ 3. State Management (Zustand Stores)

| Store | Location | Purpose |
|---|---|---|
| `useWorkstreamStore` | `src/stores/useWorkstreamStore.ts` | Active workstreams, 4-tier tasks, blueprints, and live stream buffers. |
| `useFtaStore` | `src/stores/useFtaStore.ts` | Cumulative labor hours, hourly wage calibration, and manager rating scale (1–5 stars). |
| `useUiStore` | `src/store/uiStore.ts` | Active view (`chat`, `workstreams`, `artifacts`, `customise`, `automation`, `settings`), sidebar/workbench visibility, modal states. |
| `useSessionStore` | `src/store/sessionStore.ts` | Active chat messages, turn phase (`thinking`, `streaming_text`, `awaiting_approval`), and token usage. |
| `useThemeStore` | `src/store/themeStore.ts` | Multi-theme manager (Syntropy Gradient, Dracula, Nord, Cyberpunk) with CSS variable injection. |
| `useProviderStore` | `src/store/providerStore.ts` | Provider registry keys, latency probe tests, and model limits. |
| `useWorkspaceStore` | `src/store/workspaceStore.ts` | File tree explorer, attached files context, and git remote details. |

---

## 🔌 4. IPC Communication (`src/lib/rpc.ts`)

Frontend communication with the Tauri backend operates exclusively through typed commands and event listeners:

```typescript
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// 1. Invoking typed backend command
const res = await invoke("execute_command", {
  cmd: {
    command: "launch_workstream",
    blueprint_id: "1hour-sprint",
    workstream_name: "Sprint 1",
    params: {}
  }
});

// 2. Listening to live token streaming
const unlisten = await listen("rho://event", (event) => {
  // Handle token chunks, thinking traces, or artifact publication
});
```

---

## 🧪 5. Validation Checklist

Always verify before committing UI changes:
```powershell
# Type check and production build
npm run build
```
