import { useEffect } from "react";
import { useSessionStore } from "./store/sessionStore";
import { useUiStore } from "./store/uiStore";
import { useThemeStore, applyThemeToDocument } from "./store/themeStore";
import { useRhoEngine } from "./hooks/useRhoEngine";
import { useTurnQueue } from "./hooks/useTurnQueue";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { Titlebar } from "./components/layout/Titlebar";
import { Sidebar } from "./components/layout/Sidebar";
import { Statusbar } from "./components/layout/Statusbar";
import { VirtualizedMessageFeed } from "./components/chat/VirtualizedMessageFeed";
import { ApprovalModal } from "./components/chat/ApprovalModal";
import { QueueBadge } from "./components/editor/QueueBadge";
import { PromptInput } from "./components/editor/PromptInput";
import { StreamingWorkbench } from "./components/workbench/StreamingWorkbench";
import { WorkspaceExplorer } from "./components/workspace/WorkspaceExplorer";
import { WorkstreamsView } from "./components/views/WorkstreamsView";
import { CustomiseView } from "./components/views/CustomiseView";
import { ArtifactsView } from "./components/views/ArtifactsView";
import { AutomationView } from "./components/views/AutomationView";
import { SettingsHubView } from "./components/settings/SettingsHubView";
import { CommandPalette } from "./components/palette/CommandPalette";
import { ToastContainer } from "./components/common/ToastContainer";
import { NewChatModal } from "./components/modals/NewChatModal";
import { NewAgentModal } from "./components/modals/NewAgentModal";
import { HomeHeroView } from "./components/home/HomeHeroView";
import { useSubagentStore } from "./store/subagentStore";
import { useProviderStore } from "./store/providerStore";
import { Bot } from "lucide-react";

export function App() {
  const { messages, isRunning, addUserMessage } = useSessionStore();
  const { activeView, statusbarOpen } = useUiStore();
  const { subagents, activeChatAgentId } = useSubagentStore();
  const { syncKeysToBackend, loadKeysFromSharedAuthFile } = useProviderStore();
  const { mode } = useThemeStore();
  const { prompt } = useRhoEngine();
  const { queue, dequeue } = useTurnQueue();

  const activeAgent = subagents.find((a) => a.id === activeChatAgentId);

  useEffect(() => {
    import("./lib/settingsSync").then(({ loadSettingsFromDisk }) => {
      loadSettingsFromDisk();
    });
    loadKeysFromSharedAuthFile().then(() => {
      syncKeysToBackend();
    });
  }, [loadKeysFromSharedAuthFile, syncKeysToBackend]);

  useGlobalShortcuts();
  const { isDragging } = useDragAndDrop();

  useEffect(() => {
    applyThemeToDocument();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (useThemeStore.getState().mode === "system") {
        applyThemeToDocument();
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  useEffect(() => {
    if (!isRunning && queue.length > 0) {
      const nextPrompt = dequeue();
      if (nextPrompt) {
        addUserMessage(nextPrompt);
        prompt(nextPrompt);
      }
    }
  }, [isRunning, queue, dequeue, addUserMessage, prompt]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#0d1117] text-[#c9d1d9] font-sans antialiased overflow-hidden select-none relative">
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/10 border-2 border-dashed border-blue-500 z-50 pointer-events-none flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-[#161b22] px-6 py-3 rounded-2xl border border-blue-500 shadow-2xl text-white font-semibold text-sm">
            Drop files here to tag into prompt context
          </div>
        </div>
      )}

      <Titlebar />

      <div className="flex flex-1 overflow-hidden min-w-0">
        <Sidebar />

        <main className="flex-1 flex flex-col bg-[#0d1117] min-w-0 overflow-hidden">
          {activeView === "chat" && (
            messages.length === 0 ? (
              <HomeHeroView />
            ) : (
              <>
                {activeAgent && (
                  <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] text-xs select-none flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-white font-mono">{activeAgent.name}</span>
                        <span className="text-[#8b949e] text-[11px]">• {activeAgent.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-[#8b949e]">
                      <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] font-mono">
                        Model: {activeAgent.model}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] font-mono uppercase">
                        Workspace: {activeAgent.workspaceMode}
                      </span>
                    </div>
                  </div>
                )}
                <VirtualizedMessageFeed messages={messages} />
                <ApprovalModal />
                <QueueBadge />
                <div className="p-3 px-3 sm:px-6 bg-[#0d1117] border-t border-[#30363d]/60 flex-shrink-0">
                  <div className="max-w-5xl mx-auto w-full">
                    <PromptInput />
                  </div>
                </div>
              </>
            )
          )}
          {activeView === "workstreams" && <WorkstreamsView />}
          {activeView === "files" && <WorkspaceExplorer />}
          {activeView === "customise" && <CustomiseView />}
          {activeView === "artifacts" && <ArtifactsView />}
          {activeView === "automation" && <AutomationView />}
          {activeView === "settings" && <SettingsHubView />}
        </main>

        {activeView === "chat" && messages.length > 0 && <StreamingWorkbench />}
      </div>

      {statusbarOpen && <Statusbar />}
      <CommandPalette />
      <ToastContainer />
      <NewChatModal />
      <NewAgentModal />
    </div>
  );
}

export default App;
