import { useState } from "react";
import { ProviderSettings } from "./ProviderSettings";
import { PreambleEditor } from "./PreambleEditor";
import { ModelProviderPicker } from "../agent/ModelProviderPicker";
import { Cpu, Key, Bot } from "lucide-react";

export function ModelProviderSettingsView() {
  const [activeTab, setActiveTab] = useState<"models" | "keys" | "preambles">("models");

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-4xl mx-auto text-xs text-[#c9d1d9]">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white mb-0.5 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#58a6ff]" />
            <span>AI Models, Providers & Keys</span>
          </h2>
          <p className="text-[#8b949e]">
            Configure Rig.rs LLM backend models, API credentials, local Ollama endpoints, and system preambles.
          </p>
        </div>

        <div className="flex bg-[#161b22] p-0.5 rounded-lg border border-[#30363d]">
          <button
            onClick={() => setActiveTab("models")}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[11px] font-medium transition ${
              activeTab === "models" ? "bg-[#21262d] text-white" : "text-[#8b949e] hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Active Model</span>
          </button>
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[11px] font-medium transition ${
              activeTab === "keys" ? "bg-[#21262d] text-white" : "text-[#8b949e] hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Credentials</span>
          </button>
          <button
            onClick={() => setActiveTab("preambles")}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-[11px] font-medium transition ${
              activeTab === "preambles" ? "bg-[#21262d] text-white" : "text-[#8b949e] hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Preambles</span>
          </button>
        </div>
      </div>

      {activeTab === "models" && <ModelProviderPicker />}
      {activeTab === "keys" && <ProviderSettings />}
      {activeTab === "preambles" && <PreambleEditor />}
    </div>
  );
}
