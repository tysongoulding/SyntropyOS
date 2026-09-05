import { useState, useRef, useEffect } from "react";
import { useWorkspaceStore, GitProvider } from "../../store/workspaceStore";
import { useUiStore } from "../../store/uiStore";
import { useToastStore } from "../../store/toastStore";
import { invoke } from "@tauri-apps/api/core";
import {
  Command,
  Folder,
  FolderOpen,
  GitBranch,
  ExternalLink,
  Edit3,
  Check,
  X,
  Globe,
} from "lucide-react";

export function Statusbar() {
  const {
    workspacePath,
    repoName,
    gitBranch,
    worktree,
    remoteUrl,
    remoteProvider,
    setWorkspacePath,
    setGitBranch,
    setRemoteUrl,
    setRemoteProvider,
  } = useWorkspaceStore();
  const { statusbarOpen, toggleCommandPalette } = useUiStore();
  const { addToast } = useToastStore();

  const [dirPopoverOpen, setDirPopoverOpen] = useState(false);
  const [repoPopoverOpen, setRepoPopoverOpen] = useState(false);
  const [isEditingDir, setIsEditingDir] = useState(false);
  const [newDirPath, setNewDirPath] = useState(workspacePath);
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [newBranch, setNewBranch] = useState(gitBranch);
  const [newRemoteUrl, setNewRemoteUrl] = useState(remoteUrl);
  const [newProvider, setNewProvider] = useState<GitProvider>(remoteProvider);

  const dirRef = useRef<HTMLDivElement>(null);
  const repoRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dirRef.current && !dirRef.current.contains(e.target as Node)) {
        setDirPopoverOpen(false);
        setIsEditingDir(false);
      }
      if (repoRef.current && !repoRef.current.contains(e.target as Node)) {
        setRepoPopoverOpen(false);
        setIsEditingRepo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!statusbarOpen) {
      setDirPopoverOpen(false);
      setRepoPopoverOpen(false);
    }
  }, [statusbarOpen]);

  const openLocalFolder = () => {
    invoke("open_local_path", { path: workspacePath }).catch(() => {});
    addToast(`Revealing ${workspacePath} in Explorer`, "info");
  };

  const openRemoteRepo = () => {
    invoke("open_external_url", { url: remoteUrl }).catch(() => {
      window.open(remoteUrl, "_blank");
    });
    addToast(`Opening ${remoteUrl}`, "info");
  };

  const handleSaveDir = () => {
    if (newDirPath.trim()) {
      setWorkspacePath(newDirPath.trim());
      setIsEditingDir(false);
      setDirPopoverOpen(false);
      addToast(`Updated working directory to ${newDirPath.trim()}`, "success");
    }
  };

  const handleSaveRepo = () => {
    if (newBranch.trim()) setGitBranch(newBranch.trim());
    if (newRemoteUrl.trim()) setRemoteUrl(newRemoteUrl.trim());
    setRemoteProvider(newProvider);
    setIsEditingRepo(false);
    setRepoPopoverOpen(false);
    addToast(`Updated repository config (${newBranch.trim()})`, "success");
  };

  const renderProviderIcon = (provider: GitProvider) => {
    switch (provider) {
      case "github":
        return <GitBranch className="w-3 h-3 text-[#58a6ff]" />;
      case "gitlab":
        return <Globe className="w-3 h-3 text-[#f472b6]" />;
      case "bitbucket":
        return <Globe className="w-3 h-3 text-[#58a6ff]" />;
      default:
        return <GitBranch className="w-3 h-3 text-[#58a6ff]" />;
    }
  };

  return (
    <footer
      className={`border-[#30363d] bg-[#0d1117] flex items-center justify-between px-3 text-[10px] text-[#8b949e] select-none font-mono relative z-30 overflow-hidden flex-shrink-0 transition-[height,opacity,border-color] duration-250 ease-in-out ${
        statusbarOpen
          ? "h-6 opacity-100 border-t"
          : "h-0 opacity-0 border-t-0 border-transparent pointer-events-none py-0"
      }`}
    >
      {/* Left Section */}
      <div className="flex items-center space-x-3 truncate">
        {/* Command Palette trigger */}
        <button
          onClick={toggleCommandPalette}
          className="flex items-center space-x-1 hover:text-white transition"
          title="Open Command Palette (Ctrl+K)"
        >
          <Command className="w-3 h-3 text-[#58a6ff]" />
          <span>Ctrl+K</span>
        </button>

        {/* Local Directory Link & Mouse-over Popover */}
        <div
          ref={dirRef}
          className="relative inline-block"
          onMouseEnter={() => setDirPopoverOpen(true)}
        >
          <button
            onClick={openLocalFolder}
            className="flex items-center space-x-1 text-[#c9d1d9] hover:text-[#58a6ff] transition truncate max-w-[200px] md:max-w-xs group"
            title="Click to reveal in File Explorer. Hover for options."
          >
            <Folder className="w-3 h-3 text-[#58a6ff] flex-shrink-0 group-hover:scale-110 transition" />
            <span className="truncate underline decoration-dotted decoration-[#30363d] underline-offset-2">
              {workspacePath}
            </span>
          </button>

          {/* Directory Hover Card / Popover */}
          {dirPopoverOpen && (
            <div
              className="absolute bottom-7 left-0 w-80 bg-[#161b22] border border-[#30363d] rounded-xl p-3 shadow-2xl text-xs font-sans animate-in fade-in slide-in-from-bottom-1 duration-150 text-[#c9d1d9]"
              onMouseLeave={() => {
                if (!isEditingDir) setDirPopoverOpen(false);
              }}
            >
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2 font-semibold text-white">
                <div className="flex items-center space-x-1.5">
                  <FolderOpen className="w-4 h-4 text-[#58a6ff]" />
                  <span>Local Working Directory</span>
                </div>
                <button
                  onClick={() => setDirPopoverOpen(false)}
                  className="text-[#8b949e] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isEditingDir ? (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] text-[#8b949e] bg-[#0d1117] p-2 rounded border border-[#30363d] break-all select-all">
                    {workspacePath}
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={openLocalFolder}
                      className="flex-1 flex items-center justify-center space-x-1 bg-[#1f6feb] text-white px-2 py-1.5 rounded-lg hover:bg-blue-600 transition font-semibold text-[11px]"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open in Explorer</span>
                    </button>
                    <button
                      onClick={() => {
                        setNewDirPath(workspacePath);
                        setIsEditingDir(true);
                      }}
                      className="flex items-center space-x-1 bg-[#21262d] text-[#c9d1d9] hover:text-white px-2 py-1.5 rounded-lg border border-[#30363d] transition text-[11px]"
                      title="Change directory"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Change</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] text-[#8b949e] uppercase font-semibold tracking-wider">
                    New Working Directory Path
                  </label>
                  <input
                    type="text"
                    value={newDirPath}
                    onChange={(e) => setNewDirPath(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px] focus:border-[#58a6ff] outline-none"
                    placeholder="e.g. C:\projects\my-app"
                    autoFocus
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveDir}
                      className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-500 transition text-[11px]"
                    >
                      <Check className="w-3 h-3" />
                      <span>Apply</span>
                    </button>
                    <button
                      onClick={() => setIsEditingDir(false)}
                      className="px-2 py-1 bg-[#21262d] text-[#8b949e] hover:text-white rounded-lg border border-[#30363d] text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remote Repo / Branch / Worktree Link & Mouse-over Popover */}
        <div
          ref={repoRef}
          className="relative inline-block"
          onMouseEnter={() => setRepoPopoverOpen(true)}
        >
          <button
            onClick={openRemoteRepo}
            className="flex items-center space-x-1 text-purple-300 hover:text-purple-200 hover:bg-purple-950/30 px-1 py-0.5 rounded transition flex-shrink-0 group"
            title="Click to open remote repo in browser. Hover for options."
          >
            {renderProviderIcon(remoteProvider)}
            <span className="font-semibold">{repoName}</span>
            <span className="text-[#484f58]">/</span>
            <span>{gitBranch}</span>
            {worktree && worktree !== "default" && (
              <>
                <span className="text-[#484f58]">@</span>
                <span className="text-purple-400">{worktree}</span>
              </>
            )}
            <ExternalLink className="w-2.5 h-2.5 text-purple-400/60 group-hover:text-purple-300 transition ml-0.5" />
          </button>

          {/* Repo Hover Card / Popover */}
          {repoPopoverOpen && (
            <div
              className="absolute bottom-7 left-0 w-84 bg-[#161b22] border border-[#30363d] rounded-xl p-3 shadow-2xl text-xs font-sans animate-in fade-in slide-in-from-bottom-1 duration-150 text-[#c9d1d9]"
              onMouseLeave={() => {
                if (!isEditingRepo) setRepoPopoverOpen(false);
              }}
            >
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2 font-semibold text-white">
                <div className="flex items-center space-x-1.5">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span>Remote Git Repository</span>
                </div>
                <button
                  onClick={() => setRepoPopoverOpen(false)}
                  className="text-[#8b949e] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isEditingRepo ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8b949e]">Provider:</span>
                    <span className="capitalize font-semibold text-white">{remoteProvider}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8b949e]">Branch:</span>
                    <span className="font-mono text-purple-300 font-semibold">{gitBranch}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8b949e]">Worktree:</span>
                    <span className="font-mono text-white">{worktree || "default"}</span>
                  </div>

                  <p className="font-mono text-[10px] text-[#8b949e] bg-[#0d1117] p-2 rounded border border-[#30363d] break-all select-all">
                    {remoteUrl}
                  </p>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={openRemoteRepo}
                      className="flex-1 flex items-center justify-center space-x-1 bg-purple-600 text-white px-2 py-1.5 rounded-lg hover:bg-purple-500 transition font-semibold text-[11px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open on {remoteProvider.toUpperCase()}</span>
                    </button>
                    <button
                      onClick={() => {
                        setNewBranch(gitBranch);
                        setNewRemoteUrl(remoteUrl);
                        setNewProvider(remoteProvider);
                        setIsEditingRepo(true);
                      }}
                      className="flex items-center space-x-1 bg-[#21262d] text-[#c9d1d9] hover:text-white px-2 py-1.5 rounded-lg border border-[#30363d] transition text-[11px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Change</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-[#8b949e] uppercase font-semibold tracking-wider">
                      Provider
                    </label>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {(["github", "gitlab", "bitbucket", "git"] as GitProvider[]).map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setNewProvider(prov)}
                          className={`py-1 rounded text-[10px] capitalize font-medium border ${
                            newProvider === prov
                              ? "bg-purple-600/30 border-purple-500 text-purple-200"
                              : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white"
                          }`}
                        >
                          {prov}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8b949e] uppercase font-semibold tracking-wider">
                      Git Branch
                    </label>
                    <input
                      type="text"
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-white font-mono text-[11px] focus:border-purple-500 outline-none mt-1"
                      placeholder="e.g. main or feature/xyz"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8b949e] uppercase font-semibold tracking-wider">
                      Remote URL
                    </label>
                    <input
                      type="text"
                      value={newRemoteUrl}
                      onChange={(e) => setNewRemoteUrl(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-white font-mono text-[11px] focus:border-purple-500 outline-none mt-1"
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={handleSaveRepo}
                      className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-500 transition text-[11px]"
                    >
                      <Check className="w-3 h-3" />
                      <span>Apply</span>
                    </button>
                    <button
                      onClick={() => setIsEditingRepo(false)}
                      className="px-2 py-1 bg-[#21262d] text-[#8b949e] hover:text-white rounded-lg border border-[#30363d] text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span><kbd className="bg-[#161b22] px-1 py-0.5 rounded border border-[#30363d]">Ctrl+B</kbd> Sidebar</span>
          <span><kbd className="bg-[#161b22] px-1 py-0.5 rounded border border-[#30363d]">Ctrl+\</kbd> Workbench</span>
        </div>
      </div>
    </footer>
  );
}
