import { useState } from "react";
import { useProviderStore, ProviderConfig } from "../../store/providerStore";
import { useToastStore } from "../../store/toastStore";
import { useRhoEngine } from "../../hooks/useRhoEngine";
import {
  Key,
  Eye,
  EyeOff,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Check,
  Save,
  Star,
  Activity,
} from "lucide-react";

export function ProviderSettings() {
  const {
    providers,
    setApiKey,
    setEndpoint,
    checkOllama,
    ollamaStatus,
    activeProviderId,
    activeModel,
    setActiveProviderAndModel,
    testProviderKeyLive,
  } = useProviderStore();
  const { addToast } = useToastStore();
  const { send } = useRhoEngine();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testStatuses, setTestStatuses] = useState<
    Record<string, { status: "idle" | "testing" | "success" | "error"; message?: string; latency?: number }>
  >({});

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleKeySave = (providerId: string, providerName: string, key: string) => {
    setApiKey(providerId, key);
    if (key.trim()) {
      addToast(`Saved ${providerName} API Key to Vault & Synced with Engine`, "success");
    } else {
      addToast(`Cleared ${providerName} API Key`, "info");
    }
  };

  const handleSetActive = async (prov: ProviderConfig) => {
    setActiveProviderAndModel(prov.id, prov.defaultModel);
    await send({ type: "set_model", provider: prov.id, model: prov.defaultModel });
    addToast(`${prov.name} (${prov.defaultModel}) is now your active AI engine`, "success");
  };

  const handleTestKey = async (provider: ProviderConfig, key: string) => {
    const cleanKey = key.trim();
    if (!cleanKey) {
      addToast(`Please enter an API key for ${provider.name} before testing`, "error");
      return;
    }

    setTestStatuses((prev) => ({ ...prev, [provider.id]: { status: "testing" } }));

    // Run real live network test probe against provider endpoint
    const res = await testProviderKeyLive(provider.id, cleanKey);

    if (res.success) {
      setTestStatuses((prev) => ({
        ...prev,
        [provider.id]: { status: "success", latency: res.latency, message: res.message },
      }));
      addToast(`✓ ${provider.name}: ${res.message}`, "success");
    } else {
      setTestStatuses((prev) => ({
        ...prev,
        [provider.id]: { status: "error", latency: res.latency, message: res.message },
      }));
      addToast(`✗ ${provider.name} verification failed: ${res.message}`, "error");
    }
  };

  const apiKeyProviders = Object.values(providers).filter((p) => p.type === "api_key");
  const oauthProviders = Object.values(providers).filter((p) => p.type === "oauth");
  const localProvider = providers.ollama;

  return (
    <div className="space-y-6">
      {/* API Key Providers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Key className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Cloud Providers & API Keys</span>
          </h3>
          <span className="text-[11px] text-[#8b949e]">
            Active: <strong className="text-white font-mono">{activeProviderId}</strong> ({activeModel})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {apiKeyProviders.map((prov) => (
            <ApiKeyCard
              key={prov.id}
              provider={prov}
              isActive={activeProviderId.toLowerCase() === prov.id.toLowerCase()}
              showKey={!!showKeys[prov.id]}
              testState={testStatuses[prov.id]}
              onToggleShow={() => toggleShowKey(prov.id)}
              onKeySave={(k) => handleKeySave(prov.id, prov.name, k)}
              onTestKey={(k) => handleTestKey(prov, k)}
              onSetActive={() => handleSetActive(prov)}
            />
          ))}
        </div>
      </div>

      {/* Local LLMs (Ollama) */}
      {localProvider && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white text-xs">Ollama / Local Inference</span>
            </div>

            <div className="flex items-center space-x-2">
              {ollamaStatus === "online" && (
                <span className="flex items-center space-x-1 text-green-400 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Online ({localProvider.models.length} models)</span>
                </span>
              )}
              {ollamaStatus === "offline" && (
                <span className="flex items-center space-x-1 text-red-400 text-[11px] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unreachable</span>
                </span>
              )}

              <button
                onClick={() => {
                  checkOllama();
                  addToast("Probing Ollama endpoint at http://localhost:11434...", "info");
                }}
                disabled={ollamaStatus === "checking"}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white transition text-[11px]"
              >
                <RefreshCw className={`w-3 h-3 ${ollamaStatus === "checking" ? "animate-spin text-blue-400" : ""}`} />
                <span>Probe Endpoint</span>
              </button>

              <button
                onClick={() => handleSetActive(localProvider)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition flex items-center space-x-1 ${
                  activeProviderId === "ollama"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white"
                }`}
              >
                <Star className="w-3 h-3" />
                <span>{activeProviderId === "ollama" ? "Active" : "Set Active"}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={localProvider.endpoint || "http://localhost:11434"}
              onChange={(e) => setEndpoint("ollama", e.target.value)}
              placeholder="http://localhost:11434"
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 font-mono text-[11px] text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {localProvider.models.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {localProvider.models.map((m) => (
                <span
                  key={m}
                  className="bg-[#0d1117] text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded text-[10px] font-mono"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OAuth Device Authentication */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center space-x-1.5">
          <LogIn className="w-3.5 h-3.5 text-purple-400" />
          <span>OAuth & Subscription Logins</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {oauthProviders.map((prov) => (
            <div
              key={prov.id}
              className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-white text-xs">{prov.name}</div>
                <div className="text-[10px] text-[#8b949e]">Device Code / PKCE Flow</div>
              </div>

              <button
                onClick={() => addToast(`Initiating OAuth PKCE handshake for ${prov.name}`, "info")}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white font-medium text-[11px] transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Authenticate</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ApiKeyCardProps {
  provider: ProviderConfig;
  isActive: boolean;
  showKey: boolean;
  testState?: { status: "idle" | "testing" | "success" | "error"; message?: string; latency?: number };
  onToggleShow: () => void;
  onKeySave: (key: string) => void;
  onTestKey: (key: string) => void;
  onSetActive: () => void;
}

function ApiKeyCard({
  provider,
  isActive,
  showKey,
  testState,
  onToggleShow,
  onKeySave,
  onTestKey,
  onSetActive,
}: ApiKeyCardProps) {
  const [currentVal, setCurrentVal] = useState(provider.apiKey || "");

  const handleSave = () => {
    onKeySave(currentVal);
  };

  return (
    <div
      className={`p-3.5 bg-[#161b22] border rounded-xl space-y-2.5 transition ${
        isActive ? "border-blue-500/80 ring-1 ring-blue-500/20 shadow-md shadow-blue-500/5" : "border-[#30363d]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white text-xs">{provider.name}</span>
          {isActive && (
            <span className="bg-blue-600/20 border border-blue-500/40 text-blue-400 text-[10px] px-1.5 py-0.2 rounded font-semibold">
              ACTIVE
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          {provider.isConfigured ? (
            <span className="flex items-center space-x-1 text-green-400 text-[10px] font-semibold">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </span>
          ) : (
            <span className="text-[#8b949e] text-[10px]">No Key</span>
          )}

          {!isActive && (
            <button
              onClick={onSetActive}
              className="text-[10px] px-2 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition flex items-center space-x-1"
              title="Set as Active Provider"
            >
              <Star className="w-2.5 h-2.5" />
              <span>Set Active</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1.5">
        <div className="relative flex-1 flex items-center">
          <input
            type={showKey ? "text" : "password"}
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder={`Enter ${provider.name} API Key...`}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-3 pr-8 py-1.5 font-mono text-[11px] text-white placeholder-[#484f58] focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-2.5 text-[#8b949e] hover:text-white p-0.5"
          >
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          onClick={handleSave}
          className="p-1.5 rounded-lg bg-[#21262d] hover:bg-blue-600/30 hover:border-blue-500 border border-[#30363d] text-[#8b949e] hover:text-white transition flex items-center justify-center flex-shrink-0"
          title="Save API Key to Vault"
        >
          <Save className="w-3.5 h-3.5 text-blue-400" />
        </button>

        <button
          onClick={() => onTestKey(currentVal)}
          disabled={testState?.status === "testing"}
          className="px-2 py-1.5 rounded-lg bg-[#21262d] hover:bg-emerald-950/40 hover:border-emerald-500 border border-[#30363d] text-emerald-400 hover:text-emerald-300 transition flex items-center space-x-1 text-[11px] font-medium flex-shrink-0"
          title="Test and Verify API Key"
        >
          <Activity className={`w-3.5 h-3.5 ${testState?.status === "testing" ? "animate-spin text-blue-400" : ""}`} />
          <span>{testState?.status === "testing" ? "Testing..." : "Test"}</span>
        </button>
      </div>

      {/* Test feedback banner */}
      {testState && testState.status !== "idle" && (
        <div
          className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between border ${
            testState.status === "success"
              ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-400"
              : testState.status === "error"
              ? "bg-rose-950/30 border-rose-800/40 text-rose-400"
              : "bg-blue-950/30 border-blue-800/40 text-blue-400"
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate mr-2">
            {testState.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
            {testState.status === "error" && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
            {testState.status === "testing" && <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
            <span className="truncate">
              {testState.message || (testState.status === "testing" ? "Testing provider API endpoint..." : "")}
            </span>
          </div>
          {testState.latency !== undefined && (
            <span className="font-mono text-[10px] opacity-80 flex-shrink-0">{testState.latency}ms</span>
          )}
        </div>
      )}
    </div>
  );
}
