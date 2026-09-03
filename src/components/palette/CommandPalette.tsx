import { useState, useEffect } from "react";
import { useUiStore } from "../../store/uiStore";
import { useSessionStore } from "../../store/sessionStore";
import { useAgentStore, DEFAULT_PERSONAS } from "../../store/agentStore";
import { useToastStore } from "../../store/toastStore";
import {
  Search,
  MessageSquare,
  FolderTree,
  Bot,
  Wrench,
  GitBranch,
  ListTodo,
  Settings,
  Palette,
  RotateCcw,
  Sparkles,
  PanelBottom,
  User,
} from "lucide-react";

interface PaletteCommand {
  id: string;
  category: "Navigation" | "Actions" | "Personas" | "Tools";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveView,
    setActiveSettingsTab,
    setActiveCustomiseTab,
    toggleSidebar,
    toggleWorkbench,
  } = useUiStore();
  const { resetSession } = useSessionStore();
  const { setActivePersona } = useAgentStore();
  const { addToast } = useToastStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: PaletteCommand[] = [
    // Navigation
    {
      id: "nav-chat",
      category: "Navigation",
      label: "Go to Chat & Feed",
      description: "Main conversational workspace and live streaming",
      icon: MessageSquare,
      action: () => setActiveView("chat"),
    },
    {
      id: "nav-files",
      category: "Navigation",
      label: "Open Workspace Explorer",
      description: "Browse files and project hierarchy",
      icon: FolderTree,
      action: () => setActiveView("files"),
    },
    {
      id: "nav-agents",
      category: "Navigation",
      label: "Manage Chat Personas",
      description: "Configure Rig agent prompts and personas in Customise",
      icon: Bot,
      action: () => {
        setActiveCustomiseTab("personas");
        setActiveView("customise");
      },
    },
    {
      id: "nav-tools",
      category: "Navigation",
      label: "Dynamic Toolbox & MCP",
      description: "Inspect tools, permissions, and latency",
      icon: Wrench,
      action: () => {
        setActiveSettingsTab("tools");
        setActiveView("settings");
      },
    },
    {
      id: "nav-plans",
      category: "Navigation",
      label: "View Structured Plans",
      description: "Interactive Rig extractor task checklist",
      icon: ListTodo,
      action: () => {
        setActiveSettingsTab("plans");
        setActiveView("settings");
      },
    },
    {
      id: "nav-sessions",
      category: "Navigation",
      label: "Session DAG Graph",
      description: "Visual timeline of turns and branching checkpoints",
      icon: GitBranch,
      action: () => {
        setActiveSettingsTab("sessions");
        setActiveView("settings");
      },
    },
    {
      id: "nav-settings",
      category: "Navigation",
      label: "AI Providers & API Keys",
      description: "Manage credentials and model backends",
      icon: Settings,
      action: () => {
        setActiveSettingsTab("providers");
        setActiveView("settings");
      },
    },
    {
      id: "nav-appearance",
      category: "Navigation",
      label: "Theme & Hex Colors",
      description: "Switch light/dark mode and presets",
      icon: Palette,
      action: () => {
        setActiveSettingsTab("theme");
        setActiveView("settings");
      },
    },

    // Actions
    {
      id: "act-new-agent",
      category: "Actions",
      label: "New Chat Persona",
      description: "Create or configure a chat persona",
      icon: User,
      action: () => {
        setActiveCustomiseTab("personas");
        setActiveView("customise");
        addToast("Opened Chat Personas & Inspector", "info");
      },
    },
    {
      id: "act-new-chat",
      category: "Actions",
      label: "New Chat",
      description: "Reset active conversation context and start fresh",
      icon: RotateCcw,
      shortcut: "Ctrl+Shift+N",
      action: () => {
        resetSession();
        setActiveView("chat");
        addToast("Started a new chat session", "success");
      },
    },
    {
      id: "act-toggle-sidebar",
      category: "Actions",
      label: "Toggle Sidebar",
      description: "Show or hide the workspace navigation sidebar",
      icon: FolderTree,
      shortcut: "Ctrl+B",
      action: toggleSidebar,
    },
    {
      id: "act-toggle-workbench",
      category: "Actions",
      label: "Toggle Streaming Workbench",
      description: "Show or hide the side diff & reasoning panel",
      icon: Sparkles,
      shortcut: "Ctrl+\\",
      action: toggleWorkbench,
    },
    {
      id: "act-toggle-statusbar",
      category: "Actions",
      label: "Toggle Statusbar",
      description: "Show or hide the bottom workspace status bar",
      icon: PanelBottom,
      action: useUiStore.getState().toggleStatusbar,
    },

    // Personas
    ...DEFAULT_PERSONAS.map((persona) => ({
      id: `persona-${persona.id}`,
      category: "Personas" as const,
      label: `Switch Persona: ${persona.name}`,
      description: persona.description,
      icon: Bot,
      action: () => {
        setActivePersona(persona.id);
        addToast(`Switched persona to ${persona.name}`, "info");
      },
    })),
  ];

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!commandPaletteOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[selectedIndex];
      if (cmd) {
        cmd.action();
        setCommandPaletteOpen(false);
      }
    } else if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      onClick={() => setCommandPaletteOpen(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden text-xs flex flex-col max-h-[480px]"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
          <Search className="w-4 h-4 text-[#58a6ff] mr-2.5 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, navigate, or switch persona..."
            className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-[#8b949e]"
          />
          <kbd className="bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded border border-[#30363d] text-[10px] font-mono">
            Esc
          </kbd>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-[#8b949e]">No matching commands found.</div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setCommandPaletteOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left ${
                    isSelected ? "bg-[#1f6feb] text-white" : "text-[#c9d1d9] hover:bg-[#21262d]"
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-white" : "text-[#58a6ff]"}`} />
                    <div className="truncate">
                      <div className="font-semibold truncate">{cmd.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? "text-blue-100" : "text-[#8b949e]"
                        }`}
                      >
                        {cmd.description}
                      </div>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isSelected
                          ? "bg-blue-800 text-white border border-blue-600"
                          : "bg-[#0d1117] text-[#8b949e] border border-[#30363d]"
                      }`}
                    >
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
