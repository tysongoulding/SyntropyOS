import { useUiStore, WorkbenchTab } from "../../store/uiStore";
import { useSessionStore } from "../../store/sessionStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { DiffViewer } from "../chat/DiffViewer";
import { CodeBlock } from "../chat/CodeBlock";
import {
  Columns,
  Brain,
  FileCode,
  Code2,
  FileText,
  BarChart3,
  X,
} from "lucide-react";

export function StreamingWorkbench() {
  const { workbenchOpen, activeWorkbenchTab, setActiveWorkbenchTab, setWorkbenchOpen } = useUiStore();
  const { messages, usage, sessionInfo, compaction } = useSessionStore();
  const { selectedFile } = useWorkspaceStore();

  if (!workbenchOpen) return null;

  // Find latest edit tool call
  const latestEditMsg = [...messages].reverse().find(
    (m) => m.role === "tool" && m.toolCall?.tool === "edit"
  );
  const editArgs = latestEditMsg?.toolCall?.arguments;

  // Find latest thinking reasoning
  const latestThinking = [...messages].reverse().find((m) => m.reasoning)?.reasoning;

  const tabs: { id: WorkbenchTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "diff", label: "Diff", icon: FileCode },
    { id: "file", label: "File", icon: FileText },
    { id: "thinking", label: "Thinking", icon: Brain },
    { id: "usage", label: "Usage", icon: BarChart3 },
    { id: "json", label: "JSON", icon: Code2 },
  ];

  return (
    <aside className="w-96 md:w-[480px] border-l border-[#30363d] bg-[#0d1117] flex flex-col h-full text-xs select-none">
      {/* Workbench Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
        <div className="flex items-center space-x-1.5">
          <Columns className="w-4 h-4 text-[#58a6ff]" />
          <span className="font-semibold text-white">Workbench</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-[#0d1117] p-0.5 rounded border border-[#30363d]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeWorkbenchTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveWorkbenchTab(tab.id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] transition ${
                    isActive ? "bg-[#21262d] text-white font-medium" : "text-[#8b949e] hover:text-white"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setWorkbenchOpen(false)}
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition"
            title="Close Workbench"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workbench Content Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeWorkbenchTab === "diff" && (
          <div>
            {editArgs &&
            typeof editArgs.target_content === "string" &&
            typeof editArgs.replacement_content === "string" ? (
              <DiffViewer
                filePath={typeof editArgs.file_path === "string" ? editArgs.file_path : undefined}
                targetContent={editArgs.target_content}
                replacementContent={editArgs.replacement_content}
                startLine={typeof editArgs.start_line === "number" ? editArgs.start_line : 1}
              />
            ) : (
              <div className="text-center py-16 text-[#8b949e]">
                <FileCode className="w-8 h-8 mx-auto mb-2 text-[#30363d]" />
                <p>No active file diff in the current turn.</p>
                <p className="text-[10px] text-[#484f58] mt-1">Execute an edit or write tool to inspect diffs here.</p>
              </div>
            )}
          </div>
        )}

        {activeWorkbenchTab === "file" && (
          <div>
            {selectedFile ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-white text-xs font-semibold">{selectedFile.path}</span>
                </div>
                <CodeBlock
                  language={selectedFile.path.split(".").pop() || "text"}
                  code={selectedFile.content || `// ${selectedFile.path}\n// Ready for agent edit.`}
                />
              </div>
            ) : (
              <div className="text-center py-16 text-[#8b949e]">
                <FileText className="w-8 h-8 mx-auto mb-2 text-[#30363d]" />
                <p>No file selected for preview.</p>
                <p className="text-[10px] text-[#484f58] mt-1">Select a file in Workspace Explorer to view its code.</p>
              </div>
            )}
          </div>
        )}

        {activeWorkbenchTab === "thinking" && (
          <div>
            {latestThinking ? (
              <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl whitespace-pre-wrap font-mono text-[11px] text-[#c9d1d9] leading-relaxed">
                {latestThinking}
              </div>
            ) : (
              <div className="text-center py-16 text-[#8b949e]">
                <Brain className="w-8 h-8 mx-auto mb-2 text-[#30363d]" />
                <p>No reasoning stream recorded yet.</p>
              </div>
            )}
          </div>
        )}

        {activeWorkbenchTab === "usage" && (
          <div className="space-y-4">
            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Session Token Usage</span>
                <span className="text-[10px] text-blue-400 font-mono">
                  {sessionInfo.model || "gemini-flash-latest"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <span className="text-[10px] text-[#8b949e]">Input Tokens</span>
                  <div className="font-mono text-white font-semibold">
                    {(usage.inputTokens || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-2 bg-[#0d1117] rounded-lg border border-[#30363d]">
                  <span className="text-[10px] text-[#8b949e]">Output Tokens</span>
                  <div className="font-mono text-white font-semibold">
                    {(usage.outputTokens || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-2 bg-[#0d1117] rounded-lg border border-[#30363d] flex items-center justify-between text-[11px]">
                <span className="text-[#8b949e]">Tokens Reclaimed (Compaction)</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {compaction.totalTokensSaved.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl space-y-1.5">
              <span className="font-semibold text-white text-[11px]">Token Ledger & Costs</span>
              <p className="text-[10px] text-[#8b949e] leading-relaxed">
                Live cost tracking is active. Real-time rates calculate per turn based on standard provider pricing tables.
              </p>
            </div>
          </div>
        )}

        {activeWorkbenchTab === "json" && (
          <div>
            <CodeBlock
              language="json"
              code={JSON.stringify(messages[messages.length - 1] || {}, null, 2)}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
