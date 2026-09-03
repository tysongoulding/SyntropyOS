import { useState } from "react";
import { useUiStore } from "../../store/uiStore";
import { useSubagentStore, SubagentDefinition } from "../../store/subagentStore";
import { useToastStore } from "../../store/toastStore";
import {
  Bot,
  GitBranch,
  Wrench,
  PlugZap,
  Network,
  Cpu,
  X,
  Plus,
  Check,
} from "lucide-react";

export function NewAgentModal() {
  const { newAgentModalOpen, setNewAgentModalOpen } = useUiStore();
  const { addSubagent } = useSubagentStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState<SubagentDefinition["model"]>("inherit");
  const [workspaceMode, setWorkspaceMode] = useState<SubagentDefinition["workspaceMode"]>("inherit");
  const [enableWriteTools, setEnableWriteTools] = useState(true);
  const [enableMcpTools, setEnableMcpTools] = useState(true);
  const [enableSubagentTools, setEnableSubagentTools] = useState(false);

  if (!newAgentModalOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) {
      addToast("Agent name is required", "error");
      return;
    }

    const formattedName = name.trim().toLowerCase().replace(/\s+/g, "-");

    addSubagent({
      name: formattedName,
      role: role.trim() || "Autonomous Specialist",
      description: description.trim() || "Autonomous agent for specialized engineering and workflow tasks.",
      systemPrompt: systemPrompt.trim() || `You are the ${formattedName} agent.`,
      model,
      workspaceMode,
      enableWriteTools,
      enableMcpTools,
      enableSubagentTools,
    });

    setNewAgentModalOpen(false);
    setName("");
    setRole("");
    setDescription("");
    setSystemPrompt("");
    addToast(`Created new agent: ${formattedName}`, "success");
  };

  return (
    <div
      onClick={() => setNewAgentModalOpen(false)}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150 text-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-xs">Create Agent</h3>
              <p className="text-[10px] text-[#8b949e]">
                Define an agent with workspace branching, model tier, and tool permissions.
              </p>
            </div>
          </div>

          <button
            onClick={() => setNewAgentModalOpen(false)}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Agent Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[#8b949e] uppercase">Agent Identifier</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-purple-500"
                placeholder="e.g. release-lead or db-migrator"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[#8b949e] uppercase">Role Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                placeholder="e.g. Senior Release Architect"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[#8b949e] uppercase">Capability Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-white outline-none focus:border-purple-500 resize-none text-xs"
              placeholder="What specialized tasks does this agent execute?"
            />
          </div>

          {/* Workspace Mode & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[#8b949e] uppercase flex items-center space-x-1">
                <GitBranch className="w-3 h-3 text-cyan-400" />
                <span>Workspace Isolation Mode</span>
              </label>
              <select
                value={workspaceMode}
                onChange={(e) => setWorkspaceMode(e.target.value as SubagentDefinition["workspaceMode"])}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 font-mono text-xs"
              >
                <option value="inherit">inherit (Shares parent workspace)</option>
                <option value="branch">branch (Isolated git worktree)</option>
                <option value="share">share (Shared underlying repo)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[#8b949e] uppercase flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-blue-400" />
                <span>Model Tier</span>
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as SubagentDefinition["model"])}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 font-mono text-xs"
              >
                <option value="inherit">inherit (Parent Model)</option>
                <option value="flash_lite">flash_lite (Lightweight model)</option>
                <option value="flash">flash (Fast speed / research)</option>
                <option value="pro">pro (High reasoning / refactors)</option>
              </select>
            </div>
          </div>

          {/* Tool Permissions */}
          <div className="space-y-2 p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
            <label className="text-[10px] font-semibold text-[#8b949e] uppercase">Tool Group Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEnableWriteTools(!enableWriteTools)}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                  enableWriteTools
                    ? "bg-purple-950/30 border-purple-500 text-white font-medium"
                    : "bg-[#161b22] border-[#30363d] text-[#8b949e]"
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px]">Write Tools</span>
                </div>
                {enableWriteTools && <Check className="w-3 h-3 text-purple-400" />}
              </button>

              <button
                type="button"
                onClick={() => setEnableMcpTools(!enableMcpTools)}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                  enableMcpTools
                    ? "bg-emerald-950/30 border-emerald-500 text-white font-medium"
                    : "bg-[#161b22] border-[#30363d] text-[#8b949e]"
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <PlugZap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">MCP Tools</span>
                </div>
                {enableMcpTools && <Check className="w-3 h-3 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setEnableSubagentTools(!enableSubagentTools)}
                className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                  enableSubagentTools
                    ? "bg-blue-950/30 border-blue-500 text-white font-medium"
                    : "bg-[#161b22] border-[#30363d] text-[#8b949e]"
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Network className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px]">Agent Spawner</span>
                </div>
                {enableSubagentTools && <Check className="w-3 h-3 text-blue-400" />}
              </button>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[#8b949e] uppercase">
              Agent System Prompt
            </label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-white font-mono text-[11px] outline-none focus:border-purple-500 resize-none leading-relaxed"
              placeholder="System prompt defining strict role instructions and output schema..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-end space-x-2">
          <button
            onClick={() => setNewAgentModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center space-x-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Agent</span>
          </button>
        </div>
      </div>
    </div>
  );
}
