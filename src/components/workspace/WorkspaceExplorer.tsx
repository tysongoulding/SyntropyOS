import { useState, useEffect } from "react";
import { useWorkspaceStore, FileNode } from "../../store/workspaceStore";
import { useUiStore } from "../../store/uiStore";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Search,
  Plus,
  Check,
  ChevronRight,
  ChevronDown,
  RotateCw,
} from "lucide-react";

export function WorkspaceExplorer() {
  const {
    files,
    workspacePath,
    gitBranch,
    attachFile,
    attachedFiles,
    selectFile,
    fetchWorkspaceFiles,
    loadFileContent,
    isLoadingFiles,
  } = useWorkspaceStore();
  const { setWorkbenchOpen, setActiveWorkbenchTab } = useUiStore();
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchWorkspaceFiles();
  }, [fetchWorkspaceFiles]);

  const handleInspect = async (node: FileNode) => {
    if (!node.isDir) {
      const content = await loadFileContent(node.path);
      selectFile({ path: node.path, content });
      setActiveWorkbenchTab("file");
      setWorkbenchOpen(true);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto text-xs text-[#c9d1d9]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center space-x-2">
            <Folder className="w-4 h-4 text-[#58a6ff]" />
            <span>Workspace File Explorer</span>
          </h2>
          <p className="text-[#8b949e]">
            Browse project hierarchy, inspect live files, and attach source context into turns.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchWorkspaceFiles()}
            disabled={isLoadingFiles}
            className="p-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d] transition"
            title="Rescan Workspace Files"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingFiles ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <span className="font-mono text-[10px] bg-[#161b22] px-2 py-1 rounded border border-[#30363d] text-white">
            Path: {workspacePath} ({gitBranch})
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8b949e]" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter workspace files..."
          className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* File Tree */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 select-none">
        <FileTreeList
          nodes={files}
          filter={filter}
          onInspect={handleInspect}
          onAttach={attachFile}
          attachedFiles={attachedFiles}
        />
      </div>
    </div>
  );
}

interface FileTreeListProps {
  nodes: FileNode[];
  filter: string;
  onInspect: (node: FileNode) => void;
  onAttach: (path: string) => void;
  attachedFiles: string[];
}

function FileTreeList({ nodes, filter, onInspect, onAttach, attachedFiles }: FileTreeListProps) {
  return (
    <div className="space-y-0.5 font-mono text-xs">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          filter={filter}
          onInspect={onInspect}
          onAttach={onAttach}
          attachedFiles={attachedFiles}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  filter: string;
  onInspect: (node: FileNode) => void;
  onAttach: (path: string) => void;
  attachedFiles: string[];
}

function FileTreeNode({ node, filter, onInspect, onAttach, attachedFiles }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const matchesFilter = (n: FileNode): boolean => {
    if (!filter) return true;
    if (n.name.toLowerCase().includes(filter.toLowerCase())) return true;
    if (n.children) {
      return n.children.some(matchesFilter);
    }
    return false;
  };

  if (!matchesFilter(node)) return null;

  const isAttached = attachedFiles.includes(node.path);

  if (node.isDir) {
    const isExpanded = filter ? true : expanded;
    return (
      <div>
        <div
          onClick={() => setExpanded(!expanded)}
          className="flex items-center space-x-1.5 py-1 px-1.5 rounded hover:bg-[#21262d] cursor-pointer text-[#8b949e] hover:text-white transition group"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#8b949e]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#8b949e]" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-[#58a6ff]" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-[#8b949e]" />
          )}
          <span className="font-semibold text-white">{node.name}</span>
        </div>

        {isExpanded && node.children && (
          <div className="pl-4 border-l border-[#30363d]/50 ml-2 space-y-0.5">
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                filter={filter}
                onInspect={onInspect}
                onAttach={onAttach}
                attachedFiles={attachedFiles}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#21262d] transition group">
      <div
        onClick={() => onInspect(node)}
        className="flex items-center space-x-2 cursor-pointer flex-1 truncate"
      >
        {node.name.endsWith(".rs") || node.name.endsWith(".ts") || node.name.endsWith(".tsx") ? (
          <FileCode className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-[#8b949e] flex-shrink-0" />
        )}
        <span className="text-[#c9d1d9] group-hover:text-white truncate">{node.name}</span>
        {node.size !== undefined && (
          <span className="text-[10px] text-[#8b949e] hidden sm:inline">
            {(node.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAttach(node.path);
          }}
          disabled={isAttached}
          className={`p-1 rounded text-[10px] flex items-center space-x-1 ${
            isAttached
              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
              : "hover:bg-[#30363d] text-[#8b949e] hover:text-white"
          }`}
          title={isAttached ? "Attached to context" : "Attach file to turn context (@file)"}
        >
          {isAttached ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          <span>{isAttached ? "Attached" : "Attach"}</span>
        </button>
      </div>
    </div>
  );
}
