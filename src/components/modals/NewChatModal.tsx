import { useState } from "react";
import { useUiStore } from "../../store/uiStore";
import { useSessionStore } from "../../store/sessionStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useAgentStore } from "../../store/agentStore";
import { useToastStore } from "../../store/toastStore";
import { useChatStore } from "../../store/chatStore";
import {
  MessageSquarePlus,
  Folder,
  X,
  Bot,
  Globe,
  Check,
} from "lucide-react";

export function NewChatModal() {
  const { newChatModalOpen, setNewChatModalOpen, setActiveView } = useUiStore();
  const { resetSession } = useSessionStore();
  const { createChat } = useChatStore();
  const { workspacePath, setWorkspacePath, remoteUrl, setRemoteUrl } = useWorkspaceStore();
  const { personas, activePersonaId, setActivePersona } = useAgentStore();
  const { addToast } = useToastStore();

  const [chatName, setChatName] = useState(`Chat - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  const [repoMode, setRepoMode] = useState<"none" | "url">("none");
  const [inputRepoUrl, setInputRepoUrl] = useState(remoteUrl || "https://github.com/");
  const [inputFolder, setInputFolder] = useState(workspacePath);
  const [selectedAgentId, setSelectedAgentId] = useState(activePersonaId);

  if (!newChatModalOpen) return null;

  const handleStartChat = () => {
    resetSession();
    if (inputFolder.trim()) {
      setWorkspacePath(inputFolder.trim());
    }
    const finalRepo = repoMode === "url" && inputRepoUrl.trim() ? inputRepoUrl.trim() : undefined;
    if (finalRepo) {
      setRemoteUrl(finalRepo);
    }
    if (selectedAgentId) {
      setActivePersona(selectedAgentId);
    }

    createChat(chatName.trim(), selectedAgentId, inputFolder.trim(), finalRepo);

    setNewChatModalOpen(false);
    setActiveView("chat");
    addToast(`Started new conversation: ${chatName}`, "success");
  };

  return (
    <div
      onClick={() => setNewChatModalOpen(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden text-xs flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center space-x-2">
            <MessageSquarePlus className="w-4 h-4 text-[#58a6ff]" />
            <span className="font-semibold text-white text-sm">Start New Conversation</span>
          </div>
          <button
            onClick={() => setNewChatModalOpen(false)}
            className="text-[#8b949e] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-[#c9d1d9]">
          {/* Chat Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">
              Chat Name
            </label>
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="e.g. Refactor API Parser"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white text-xs focus:border-[#58a6ff] outline-none"
              autoFocus
            />
          </div>

          {/* Repository Options */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">
              Git Repository
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRepoMode("none")}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border transition ${
                  repoMode === "none"
                    ? "bg-[#1f6feb]/20 border-blue-500 text-white font-semibold"
                    : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white"
                }`}
              >
                <span>No Repo (Skip)</span>
                {repoMode === "none" && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => setRepoMode("url")}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border transition ${
                  repoMode === "url"
                    ? "bg-[#1f6feb]/20 border-blue-500 text-white font-semibold"
                    : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Repo (URL)</span>
                {repoMode === "url" && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>

            {/* Expanded Repo URL Input */}
            {repoMode === "url" && (
              <div className="pt-2">
                <input
                  type="text"
                  value={inputRepoUrl}
                  onChange={(e) => setInputRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-purple-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Project Folder */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">
              Project Folder
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Folder className="w-4 h-4 text-[#58a6ff] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={inputFolder}
                  onChange={(e) => setInputFolder(e.target.value)}
                  placeholder="C:\path\to\workspace"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-3 py-2 text-white font-mono text-xs focus:border-[#58a6ff] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Initial Agent Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">
              Assigned Agent Persona
            </label>
            <div className="grid grid-cols-2 gap-2">
              {personas.slice(0, 4).map((p) => {
                const isSelected = selectedAgentId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedAgentId(p.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-purple-950/30 border-purple-500 text-white font-semibold"
                        : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Bot className={`w-3.5 h-3.5 ${isSelected ? "text-purple-400" : "text-[#8b949e]"}`} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-purple-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2.5 px-5 py-3.5 border-t border-[#30363d] bg-[#0d1117]">
          <button
            type="button"
            onClick={() => setNewChatModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-[#21262d] text-[#8b949e] hover:text-white transition font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartChat}
            className="px-5 py-2 rounded-xl bg-[#1f6feb] hover:bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 transition flex items-center space-x-1.5"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Start Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
