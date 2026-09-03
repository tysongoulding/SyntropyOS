import React from "react";
import { Minus, Square, X, Cpu } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const WindowChrome: React.FC = () => {
  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch {
      // Browser preview fallback
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
    } catch {
      // Browser preview fallback
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch {
      // Browser preview fallback
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="h-10 bg-slate-925 border-b border-slate-800/80 flex items-center justify-between px-3 select-none z-50 sticky top-0"
    >
      <div className="flex items-center gap-2 pointer-events-none">
        <div className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Cpu className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
          Syntropy<span className="text-emerald-400 font-bold">OS</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          v0.6.0
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-rose-500 hover:text-white text-slate-400 transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
