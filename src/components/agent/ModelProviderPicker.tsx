import { useProviderStore } from "../../store/providerStore";
import { useSessionStore } from "../../store/sessionStore";
import { useRhoEngine } from "../../hooks/useRhoEngine";
import { useToastStore } from "../../store/toastStore";
import { Sparkles, Check, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export interface ProviderItem {
  id: string;
  name: string;
  defaultModel: string;
  models: string[];
  type: "api_key" | "local" | "oauth";
}

const PROVIDERS: ProviderItem[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash-thinking-exp-01-21",
      "gemini-2.0-flash-thinking-exp",
      "gemini-2.0-pro-exp-02-05",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
      "gemini-exp-1206",
      "gemma-2-27b-it",
      "gemma-2-9b-it",
      "gemma-2-2b-it",
    ],
    type: "api_key",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    defaultModel: "claude-3-7-sonnet-20250219",
    models: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
    type: "api_key",
  },
  {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "o3-mini", "gpt-4-turbo"],
    type: "api_key",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    type: "api_key",
  },
  {
    id: "groq",
    name: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "deepseek-r1-distill-llama-70b",
    ],
    type: "api_key",
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    defaultModel: "llama3.2",
    models: ["llama3.2", "qwen2.5-coder:32b", "deepseek-r1:14b"],
    type: "local",
  },
];

export function ModelProviderPicker() {
  const { activeProviderId, activeModel, setActiveProviderAndModel, providers } = useProviderStore();
  const { setSessionModel } = useSessionStore();
  const { send } = useRhoEngine();
  const { addToast } = useToastStore();

  const handleSelect = async (providerId: string, modelName: string) => {
    setActiveProviderAndModel(providerId, modelName);
    if (setSessionModel) {
      setSessionModel(providerId, modelName);
    }
    await send({ type: "set_model", provider: providerId, model: modelName });
    addToast(`Active model set to ${modelName} (${providerId})`, "success");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto text-xs text-[#c9d1d9]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#58a6ff]" />
            <span>Active Model & Provider Selection</span>
          </h2>
          <p className="text-[#8b949e]">
            Choose your active LLM architecture. Changes apply immediately to new turns and agent executions.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#161b22] px-3 py-1.5 rounded-lg border border-[#30363d]">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[#8b949e]">Active:</span>
          <span className="font-semibold text-white font-mono text-[11px]">{activeModel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PROVIDERS.map((prov) => {
          const isCurrentProvider = activeProviderId.toLowerCase() === prov.id.toLowerCase();
          const configured = providers[prov.id]?.isConfigured;
          const availableModels = providers[prov.id]?.models?.length ? providers[prov.id].models : prov.models;

          return (
            <div
              key={prov.id}
              className={`p-4 bg-[#161b22] border rounded-xl space-y-3 transition ${
                isCurrentProvider
                  ? "border-blue-500/80 bg-[#161b22]/90 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/5"
                  : "border-[#30363d] hover:border-[#484f58]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white text-sm">{prov.name}</span>
                  <span className="text-[10px] uppercase font-mono text-[#8b949e] bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
                    {prov.type}
                  </span>
                  {configured && (
                    <span className="flex items-center space-x-0.5 text-green-400 text-[10px]" title="API Key Configured">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  )}
                </div>
                {isCurrentProvider && (
                  <span className="flex items-center text-blue-400 text-xs font-semibold bg-blue-950/40 border border-blue-800/50 px-2 py-0.5 rounded">
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Active Engine
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold flex items-center justify-between">
                  <span>Select Model:</span>
                  <span className="text-[10px] text-[#58a6ff] font-mono lowercase">{availableModels.length} models</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {availableModels.map((mod) => {
                    const isCurrentModel = isCurrentProvider && activeModel === mod;
                    return (
                      <button
                        key={mod}
                        onClick={() => handleSelect(prov.id, mod)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition flex items-center space-x-1 ${
                          isCurrentModel
                            ? "bg-blue-600 text-white font-semibold shadow-sm"
                            : "bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] hover:border-blue-400 hover:text-white"
                        }`}
                      >
                        {isCurrentModel && <CheckCircle2 className="w-3 h-3 text-white" />}
                        <span>{mod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

