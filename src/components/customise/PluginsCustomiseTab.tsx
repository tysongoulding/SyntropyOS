import { useState, useEffect } from "react";
import { ToyBrick, CheckCircle2, Sparkles } from "lucide-react";

interface PluginItem {
  id: string;
  name: string;
  version: string;
  type: string;
  status: string;
  icon: typeof ToyBrick;
  color: string;
  description: string;
  capabilities: string[];
}

const DEFAULT_PLUGINS: PluginItem[] = [
  {
    id: "rho-plugin-sdk",
    name: "Rho Plugin SDK",
    version: "v0.1.7",
    type: "Core Rust Workspace Crate",
    status: "Active (Compiled)",
    icon: ToyBrick,
    color: "text-blue-400",
    description: "Native Rust daemon plugin runtime and RPC lifecycle event dispatch engine.",
    capabilities: ["Process Hooking", "Event Interception", "IPC Protocol"],
  },
  {
    id: "dev-workflow",
    name: "Dev Workflow Toolkit",
    version: "v1.4.0",
    type: "Workflow Extension",
    status: "Active",
    icon: Sparkles,
    color: "text-purple-400",
    description: "Auditing, sanitization, and release cycle management for local development kits.",
    capabilities: ["Audit Plugins", "Sanitize Gate", "Semantic Versioning"],
  },
  {
    id: "delivery-team-plugin",
    name: "Delivery Engineering Team",
    version: "v3.1.0",
    type: "Multi-Agent Protocol",
    status: "Active",
    icon: ToyBrick,
    color: "text-pink-400",
    description: "Autonomous virtual engineering teams: intake, architecture, TDD build, and release notes.",
    capabilities: ["Strict Red-First TDD", "Defect Catalogs", "Release Logs"],
  },
];

export function PluginsCustomiseTab() {
  const [plugins, setPlugins] = useState<PluginItem[]>(DEFAULT_PLUGINS);

  useEffect(() => {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      import("@tauri-apps/api/core").then(({ invoke }) => {
        invoke<{ plugins: Array<{ name: string; command?: string; path: string; enabled: boolean; replaces: string[] }> }>("get_configured_plugins_and_mcps")
          .then((res) => {
            if (res && res.plugins && res.plugins.length > 0) {
              setPlugins(
                res.plugins.map((p) => ({
                  id: p.name,
                  name: p.name,
                  version: "v0.1.7",
                  type: "Daemon Plugin",
                  status: p.enabled ? "Active" : "Disabled",
                  icon: ToyBrick,
                  color: "text-purple-400",
                  description: p.command ? `Executable: ${p.command}` : `Path: ${p.path}`,
                  capabilities: p.replaces.length > 0 ? p.replaces : ["Event Interception"],
                }))
              );
            }
          })
          .catch((err) => console.warn("Failed to load plugins from backend:", err));
      });
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 max-w-5xl mx-auto text-xs text-[#c9d1d9]">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center space-x-2">
          <ToyBrick className="w-4 h-4 text-blue-400" />
          <span>Installed Plugins & Extension SDKs</span>
        </h2>
        <p className="text-[#8b949e]">
          Manage compiled daemon plugins, process interceptors, and multi-agent workflow extensions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plugins.map((plugin) => {
          const Icon = plugin.icon;
          return (
            <div
              key={plugin.id}
              className="p-4 bg-[#161b22] border border-[#30363d] rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-[#0d1117] border border-[#30363d]">
                      <Icon className={`w-4 h-4 ${plugin.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-xs">{plugin.name}</div>
                      <div className="text-[10px] text-[#8b949e] font-mono">{plugin.version} • {plugin.type}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-950/40 border border-green-800 text-green-400 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>{plugin.status}</span>
                  </span>
                </div>

                <p className="text-[11px] text-[#8b949e] leading-relaxed">{plugin.description}</p>
              </div>

              <div className="flex flex-wrap gap-1 pt-2 border-t border-[#30363d]/50">
                {plugin.capabilities.map((cap, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-[#0d1117] text-[#c9d1d9] px-2 py-0.5 rounded font-mono border border-[#30363d]"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
