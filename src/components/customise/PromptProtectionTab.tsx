import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Shield, ShieldAlert, Lock, CheckCircle2, RefreshCw, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

interface PromptConfigDto {
  role: string;
  is_custom: boolean;
  display_status: string;
  prompt_content: string;
}

export function PromptProtectionTab() {
  const { addToast } = useToastStore();
  const [selectedRole, setSelectedRole] = useState<"arch_sme" | "code_sme" | "coordinator">("arch_sme");
  const [config, setConfig] = useState<PromptConfigDto>({
    role: "arch_sme",
    is_custom: false,
    display_status: "Defaulted",
    prompt_content: "",
  });
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const roles = [
    { id: "arch_sme", label: "Architecture SME", roleDesc: "Zero-trust distributed topologies & DAG task specs" },
    { id: "code_sme", label: "Code SME", roleDesc: "Safe Rust & TypeScript implementation with Clippy hygiene" },
    { id: "coordinator", label: "Lead Coordinator", roleDesc: "Dumb deterministic node parsing promotion manifests" },
  ] as const;

  const loadPromptConfig = async (role: string) => {
    setLoading(true);
    try {
      const res = await invoke<PromptConfigDto>("get_prompt_config", { role });
      setConfig(res);
      setCustomText(res.prompt_content);
    } catch {
      // Fallback for dev mode / browser
      setConfig({
        role,
        is_custom: false,
        display_status: "Defaulted",
        prompt_content: "",
      });
      setCustomText("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromptConfig(selectedRole);
  }, [selectedRole]);

  const handleSaveCustom = async () => {
    setSaving(true);
    try {
      await invoke("save_custom_prompt", {
        role: selectedRole,
        content: customText,
        activate: true,
      });
      addToast(`Custom system prompt saved and activated for ${selectedRole}`, "success");
      loadPromptConfig(selectedRole);
    } catch (e: any) {
      addToast(`Failed to save prompt: ${e}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRevertToDefault = async () => {
    setSaving(true);
    try {
      await invoke("save_custom_prompt", {
        role: selectedRole,
        content: "",
        activate: false,
      });
      addToast(`Reverted ${selectedRole} to opaque Defaulted (Proprietary) mode`, "success");
      loadPromptConfig(selectedRole);
    } catch (e: any) {
      addToast(`Failed to revert prompt: ${e}`, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#c9d1d9] animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#f472b6] flex items-center justify-center shadow-sm">
              <Lock className="w-3.5 h-3.5 text-white fill-white" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              System Prompt Protection & Customization
            </h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Enforces 3-vector defense-in-depth: Dynamic Nonces, Canary Egress Filters, and Native Binary Embedding.
          </p>
        </div>

        <button
          onClick={() => loadPromptConfig(selectedRole)}
          disabled={loading}
          className="p-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white transition"
          title="Reload Prompt Status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#58a6ff]" : ""}`} />
        </button>
      </div>

      {/* Threat Vectors Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#58a6ff]">
            <Shield className="w-4 h-4" />
            <span className="font-semibold text-xs text-white">Vector 1: Direct Ingress</span>
          </div>
          <p className="text-[11px] text-[#8b949e]">
            Wraps untrusted input into dynamic cryptographic nonces (<code className="text-[#58a6ff]">&lt;user_payload nonce=&quot;...&quot;&gt;</code>) marked inert to prevent meta-instruction hijacking.
          </p>
          <div className="text-[10px] text-[#58a6ff] font-medium flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3 h-3" /> Active Pre-LLM Guard
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#f472b6]">
            <ShieldAlert className="w-4 h-4" />
            <span className="font-semibold text-xs text-white">Vector 2: Model Egress</span>
          </div>
          <p className="text-[11px] text-[#8b949e]">
            Monitors stream with invisible Canary UUID tokens and proprietary n-gram blockers. Intercepts prompt echoing before reaching the client.
          </p>
          <div className="text-[10px] text-[#f472b6] font-medium flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3 h-3" /> Active Stream Tripwires
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1.5">
          <div className="flex items-center space-x-2 text-white">
            <Lock className="w-4 h-4 text-[#58a6ff]" />
            <span className="font-semibold text-xs text-white">Vector 3: Binary Isolation</span>
          </div>
          <p className="text-[11px] text-[#8b949e]">
            Proprietary prompts are compiled into the native Rust binary via <code className="text-[#58a6ff]">include_str!</code>. Raw prompts never traverse the Tauri IPC boundary.
          </p>
          <div className="text-[10px] text-[#58a6ff] font-medium flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3 h-3" /> Zero Frontend Leakage
          </div>
        </div>
      </div>

      {/* Role Selector & Dual-Mode Configuration */}
      <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
        <div>
          <label className="text-xs font-semibold text-white block mb-2">Select Agent Role</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`p-3 rounded-lg text-left transition border ${
                  selectedRole === r.id
                    ? "bg-gradient-to-r from-[#58a6ff]/20 to-[#f472b6]/20 border-[#f472b6]/40 text-white"
                    : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]/40"
                }`}
              >
                <div className="font-semibold text-xs">{r.label}</div>
                <div className="text-[10px] text-[#8b949e] mt-0.5">{r.roleDesc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Status Banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#8b949e]">Current Execution Mode:</span>
            {config.is_custom ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#f472b6]/10 text-[#f472b6] border border-[#f472b6]/30">
                Custom (User Defined)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Defaulted (Proprietary Engine)
              </span>
            )}
          </div>

          <div>
            {config.is_custom ? (
              <button
                onClick={handleRevertToDefault}
                disabled={saving}
                className="px-3 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#f472b6] border border-[#30363d] text-xs flex items-center space-x-1.5 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert to Proprietary Default</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setConfig((prev) => ({ ...prev, is_custom: true, display_status: "Custom" }));
                  setCustomText("# Custom Instructions for " + selectedRole + "\n\nSpecify your steering guidelines here...");
                }}
                className="px-3 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] text-xs flex items-center space-x-1.5 transition"
              >
                <span>Switch to Custom Mode</span>
              </button>
            )}
          </div>
        </div>

        {/* Prompt Editor / Opaque View */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white flex items-center justify-between">
            <span>System Prompt Instructions</span>
            <span className="text-[10px] text-[#8b949e]">
              {config.is_custom ? "Transparent Markdown editor" : "Opaque / Hidden from Client Webview"}
            </span>
          </label>

          {config.is_custom ? (
            <div className="space-y-3">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={10}
                className="w-full p-3 rounded-lg bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-xs font-mono text-white outline-none leading-relaxed transition"
                placeholder="Write custom agent system instructions..."
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-[#8b949e] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#f472b6]" />
                  Custom prompts bypass proprietary IP protection; user assumes steering safety.
                </p>
                <button
                  onClick={handleSaveCustom}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#58a6ff] to-[#f472b6] text-white font-semibold text-xs flex items-center space-x-1.5 transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save & Activate Custom Prompt"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-lg bg-[#0d1117] border border-[#30363d] text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center mx-auto text-[#58a6ff]">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">[ Defaulted (Proprietary Engine) ]</h3>
                <p className="text-xs text-[#8b949e] max-w-lg mx-auto">
                  This agent role runs the compiled proprietary system instructions baked into the native Rust engine binary.
                  Contents are never serialized to the frontend and are guarded against direct prompt extraction.
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 text-[11px] font-mono px-3 py-1 rounded bg-[#161b22] text-[#58a6ff] border border-[#30363d]">
                <span>Status: Opaque &amp; Protected</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
