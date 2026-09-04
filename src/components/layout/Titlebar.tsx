import React from "react";
import { useSessionStore, TurnPhase } from "../../store/sessionStore";
import { useUiStore } from "../../store/uiStore";
import { invoke } from "@tauri-apps/api/core";
import {
  PanelLeft,
  PanelBottom,
  PanelRight,
  Cpu,
  Activity,
  Brain,
  Wrench,
  ShieldAlert,
  AlertCircle,
  Minus,
  Square,
  X,
  Zap,
} from "lucide-react";

export function Titlebar() {
  const { sessionInfo, usage, turnPhase, resetSession } = useSessionStore();
  const {
    toggleSidebar,
    toggleWorkbench,
    toggleStatusbar,
    setActiveView,
    workbenchOpen,
    sidebarOpen,
    statusbarOpen,
  } = useUiStore();

  const handleGoHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveView("chat");
    resetSession();
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.buttons === 1 && e.detail === 1) {
      const target = e.target as HTMLElement;
      if (!target.closest("button") && !target.closest("input") && !target.closest("a")) {
        invoke("start_drag_window").catch(() => {});
      }
    }
  };

  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("button") && !target.closest("input") && !target.closest("a")) {
      invoke("toggle_maximize_window").catch(() => {});
    }
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    invoke("minimize_window").catch(() => {});
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    invoke("toggle_maximize_window").catch(() => {});
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    invoke("close_window").catch(() => {});
  };

  const renderStatusPill = (phase: TurnPhase) => {
    switch (phase) {
      case "thinking":
        return (
          <div className="flex items-center space-x-1.5 text-[#f472b6] bg-[#f472b6]/10 px-2 py-0.5 rounded-full border border-[#f472b6]/30 animate-pulse">
            <Brain className="w-3.5 h-3.5" />
            <span>Thinking...</span>
          </div>
        );
      case "streaming_text":
        return (
          <div className="flex items-center space-x-1.5 text-[#58a6ff] bg-[#58a6ff]/10 px-2 py-0.5 rounded-full border border-[#58a6ff]/30 animate-pulse">
            <Activity className="w-3.5 h-3.5" />
            <span>Streaming...</span>
          </div>
        );
      case "awaiting_approval":
        return (
          <div className="flex items-center space-x-1.5 text-[#f472b6] bg-[#f472b6]/10 px-2 py-0.5 rounded-full border border-[#f472b6]/30 animate-bounce">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Waiting Approval</span>
          </div>
        );
      case "executing_tool":
        return (
          <div className="flex items-center space-x-1.5 text-[#58a6ff] bg-[#58a6ff]/10 px-2 py-0.5 rounded-full border border-[#58a6ff]/30 animate-pulse">
            <Wrench className="w-3.5 h-3.5 animate-spin" />
            <span>Running Tool...</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center space-x-1.5 text-[#f472b6] bg-[#f472b6]/10 px-2 py-0.5 rounded-full border border-[#f472b6]/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header
      data-tauri-drag-region
      onMouseDown={handleHeaderMouseDown}
      onDoubleClick={handleHeaderDoubleClick}
      className="flex items-center justify-between pl-3 pr-0 border-b border-[#30363d] bg-[#161b22] select-none text-xs h-9 cursor-default"
    >
      {/* Left Section: Logo & Name -> Sidebar Toggle -> Statusbar Toggle */}
      <div className="flex items-center space-x-1.5 h-full z-10" data-tauri-drag-region>
        {/* Logo & Company Name -> Click to Go Home */}
        <button
          onClick={handleGoHome}
          className="flex items-center space-x-2 mr-1 hover:opacity-85 transition cursor-pointer group p-0.5 rounded"
          title="Go to Home & Start New Chat"
        >
          <div className="flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-[#58a6ff] to-[#f472b6] group-hover:scale-105 transition shadow-sm">
            <Zap className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="font-semibold tracking-wide transition text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] to-[#f472b6]">
            SyntropyOS
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] font-mono border border-[#30363d]">
            v0.1.0
          </span>
        </button>

        {/* Sidebar Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          className={`p-1 rounded transition ${
            sidebarOpen ? "bg-[#21262d] text-white" : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
          }`}
          title="Toggle Navigation Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        {/* Statusbar Toggle Button (next to Sidebar Toggle) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatusbar();
          }}
          className={`p-1 rounded transition ${
            statusbarOpen ? "bg-[#21262d] text-white" : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
          }`}
          title="Toggle Bottom Statusbar"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Draggable Spacer */}
      <div data-tauri-drag-region className="flex-1 h-full cursor-default" />

      {/* Right Section: Status -> Session -> Workbench Toggle -> Window Controls */}
      <div className="flex items-center space-x-2 h-full text-[#8b949e] z-10" data-tauri-drag-region>
        {renderStatusPill(turnPhase)}

        {sessionInfo.id && (
          <span className="font-mono text-[10px] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d] hidden sm:inline">
            {sessionInfo.id.slice(0, 8)}
          </span>
        )}

        {/* Workbench Toggle Button (before Minimize) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWorkbench();
          }}
          className={`p-1 rounded transition ${
            workbenchOpen
              ? "bg-[#1f6feb]/20 text-[#58a6ff]"
              : "hover:bg-[#21262d] text-[#8b949e] hover:text-white"
          }`}
          title="Toggle Streaming Workbench (Ctrl+\)"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>

        {/* Native Window Controls */}
        <div className="flex items-center h-full ml-1">
          <button
            onClick={handleMinimize}
            className="w-10 h-full flex items-center justify-center hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleMaximize}
            className="w-10 h-full flex items-center justify-center hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
            title="Maximize / Restore"
          >
            <Square className="w-3 h-3" />
          </button>

          <button
            onClick={handleClose}
            className="w-11 h-full flex items-center justify-center hover:bg-[#e81123] text-[#8b949e] hover:text-white transition"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
