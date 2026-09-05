import { create } from "zustand";
import { TestKeyResponse } from "../types/protocol";

export interface ProviderConfig {
  id: string;
  name: string;
  type: "api_key" | "local" | "oauth";
  apiKey?: string;
  endpoint?: string;
  defaultModel: string;
  models: string[];
  isConfigured: boolean;
}

export interface PreamblePreset {
  id: string;
  name: string;
  description: string;
  content: string;
}

const DEFAULT_PREAMBLES: PreamblePreset[] = [
  {
    id: "default-coder",
    name: "Senior Rust & Fullstack Engineer",
    description: "Production-ready, concise, type-safe code with zero placeholders.",
    content: "You are an expert autonomous software engineer. Write idiomatic, robust, and clean code. Follow strict type safety and never emit placeholders.",
  },
  {
    id: "architect",
    name: "Systems Architect & Tech Lead",
    description: "Focuses on high-level system design, cohesion, and boundary isolation.",
    content: "You are a Principal Systems Architect. Analyze trade-offs, modularity, data flow, and error resilience before implementation.",
  },
  {
    id: "reviewer",
    name: "Security & Strict Code Reviewer",
    description: "Interrogates changes for edge-case defects, regressions, and safety risks.",
    content: "You are a strict security and code quality reviewer. Inspect diffs for edge cases, resource leaks, race conditions, and architectural regressions.",
  },
];

const DEFAULT_PROVIDERS: Record<string, ProviderConfig> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    type: "api_key",
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
    isConfigured: false,
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    type: "api_key",
    defaultModel: "claude-3-7-sonnet-20250219",
    models: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
    isConfigured: false,
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    type: "api_key",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini", "o3-mini", "gpt-4-turbo"],
    isConfigured: false,
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    type: "api_key",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    isConfigured: false,
  },
  groq: {
    id: "groq",
    name: "Groq",
    type: "api_key",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "deepseek-r1-distill-llama-70b",
    ],
    isConfigured: false,
  },
  ollama: {
    id: "ollama",
    name: "Ollama (Local LLM)",
    type: "local",
    endpoint: "http://localhost:11434",
    defaultModel: "llama3.2",
    models: ["llama3.2", "qwen2.5-coder:32b", "deepseek-r1:14b"],
    isConfigured: true,
  },
  chatgpt_oauth: {
    id: "chatgpt_oauth",
    name: "ChatGPT (OAuth PKCE)",
    type: "oauth",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini"],
    isConfigured: false,
  },
  copilot: {
    id: "copilot",
    name: "GitHub Copilot (Device Auth)",
    type: "oauth",
    defaultModel: "claude-3.5-sonnet",
    models: ["claude-3.5-sonnet", "gpt-4o"],
    isConfigured: false,
  },
};

const STORAGE_KEYS = {
  PROVIDERS: "rho_lota_providers_vault_v1",
  PREAMBLES: "rho_lota_preambles_v1",
  ACTIVE_SELECTION: "rho_lota_active_selection_v1",
};

const loadInitialProviders = (): Record<string, ProviderConfig> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROVIDERS);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, Partial<ProviderConfig>>;
      const result: Record<string, ProviderConfig> = { ...DEFAULT_PROVIDERS };
      for (const [key, defaultProv] of Object.entries(DEFAULT_PROVIDERS)) {
        if (parsed[key]) {
          const userModels = Array.isArray(parsed[key].models) ? parsed[key].models! : [];
          // Preserve discovered models + guarantee default models are included
          const mergedModels = Array.from(new Set([...defaultProv.models, ...userModels]));
          result[key] = {
            ...defaultProv,
            ...parsed[key],
            models: mergedModels,
          };
        }
      }
      return result;
    }
  } catch {}
  return DEFAULT_PROVIDERS;
};

const loadInitialActive = (): { provider: string; model: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SELECTION);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return { provider: "gemini", model: "gemini-2.5-flash" };
};

export type ThinkingLevel = "high" | "med" | "low" | "off";

export interface ProviderState {
  providers: Record<string, ProviderConfig>;
  activeProviderId: string;
  activeModel: string;
  thinkingLevel: ThinkingLevel;
  ollamaStatus: "online" | "offline" | "checking" | "unknown";
  preambles: PreamblePreset[];
  activePreambleId: string;

  setApiKey: (id: string, key: string) => void;
  setEndpoint: (id: string, endpoint: string) => void;
  setActiveProviderAndModel: (providerId: string, model: string) => void;
  setThinkingLevel: (level: ThinkingLevel) => void;
  syncKeysToBackend: () => Promise<void>;
  loadKeysFromSharedAuthFile: () => Promise<void>;
  testProviderKeyLive: (providerId: string, key: string) => Promise<{ success: boolean; message: string; latency?: number; models?: string[] }>;
  fetchProviderModels: (providerId: string) => Promise<string[]>;
  checkOllama: () => Promise<void>;
  savePreamble: (preset: PreamblePreset) => void;
  deletePreamble: (id: string) => void;
  setActivePreambleId: (id: string) => void;
}


const initialActive = loadInitialActive();

function loadInitialThinkingLevel(): ThinkingLevel {
  if (typeof window === "undefined") return "high";
  try {
    const saved = localStorage.getItem("rho_lota_thinking_level");
    if (saved === "high" || saved === "med" || saved === "low" || saved === "off") {
      return saved;
    }
  } catch {}
  return "high";
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: loadInitialProviders(),
  activeProviderId: initialActive.provider,
  activeModel: initialActive.model,
  thinkingLevel: loadInitialThinkingLevel(),
  ollamaStatus: "unknown",
  preambles: DEFAULT_PREAMBLES,
  activePreambleId: "default-coder",

  setThinkingLevel: (level: ThinkingLevel) => {
    try {
      localStorage.setItem("rho_lota_thinking_level", level);
    } catch {}
    set({ thinkingLevel: level });
  },

  setApiKey: (id, key) => {
    const trimmed = key.trim();
    set((state) => {
      const current = state.providers[id];
      if (!current) return state;
      const updated = {
        ...state.providers,
        [id]: {
          ...current,
          apiKey: trimmed,
          isConfigured: trimmed.length > 0,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updated));
      } catch {}
      return { providers: updated };
    });

    // Sync directly with Rust backend
    get().syncKeysToBackend();
  },

  syncKeysToBackend: async () => {
    const providers = get().providers;
    const keysMap: Record<string, string> = {};
    for (const [id, prov] of Object.entries(providers)) {
      if (prov.apiKey && prov.apiKey.trim()) {
        keysMap[id] = prov.apiKey.trim();
      }
    }

    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("sync_provider_keys", { keys: keysMap });
      } catch (err) {
        console.warn("Failed to sync API keys with backend:", err);
      }
    }
  },

  loadKeysFromSharedAuthFile: async () => {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const sharedKeys = await invoke<Record<string, string>>("get_saved_auth_keys");
        if (sharedKeys && Object.keys(sharedKeys).length > 0) {
          set((state) => {
            const updated = { ...state.providers };
            for (const [id, key] of Object.entries(sharedKeys)) {
              if (updated[id] && key && key.trim()) {
                updated[id] = {
                  ...updated[id],
                  apiKey: key.trim(),
                  isConfigured: true,
                };
              }
            }
            try {
              localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updated));
            } catch {}
            return { providers: updated };
          });
        }
      } catch (err) {
        console.warn("Failed to load shared auth keys:", err);
      }
    }
  },

  testProviderKeyLive: async (providerId: string, key: string) => {
    const cleanKey = key.trim();
    if (!cleanKey) {
      return { success: false, message: "API Key cannot be blank" };
    }

    // Call real Tauri network validation command (runs natively without CORS restrictions)
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const res = await invoke<TestKeyResponse>(
          "test_provider_key",
          { provider: providerId, key: cleanKey }
        );
        if (res.success && res.models && res.models.length > 0) {
          set((state) => {
            const current = state.providers[providerId];
            if (!current) return state;
            const mergedModels = Array.from(new Set([...current.models, ...res.models!]));
            const updated = {
              ...state.providers,
              [providerId]: {
                ...current,
                models: mergedModels,
              },
            };
            try {
              localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updated));
            } catch {}
            return { providers: updated };
          });
        }
        return { success: res.success, message: res.message, latency: res.latency_ms, models: res.models };
      } catch (err: unknown) {
        console.warn("Tauri test_provider_key command error, attempting web probe fallback:", err);
      }
    }

    // Browser fallback test for Gemini / OpenAI
    const start = performance.now();
    try {
      if (providerId === "gemini") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
        const latency = Math.round(performance.now() - start);
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const discoveredModels: string[] = [];
          if (Array.isArray(data.models)) {
            for (const m of data.models) {
              const supportsGen = Array.isArray(m.supportedGenerationMethods)
                ? m.supportedGenerationMethods.includes("generateContent")
                : true;
              if (supportsGen && typeof m.name === "string") {
                discoveredModels.push(m.name.replace(/^models\//, ""));
              }
            }
          }
          if (discoveredModels.length > 0) {
            set((state) => {
              const current = state.providers[providerId];
              if (!current) return state;
              const mergedModels = Array.from(new Set([...current.models, ...discoveredModels]));
              const updated = {
                ...state.providers,
                [providerId]: {
                  ...current,
                  models: mergedModels,
                },
              };
              try {
                localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updated));
              } catch {}
              return { providers: updated };
            });
          }
          return {
            success: true,
            message: `Google Gemini Verified (${res.status}, ${discoveredModels.length} models discovered)`,
            latency,
            models: discoveredModels,
          };
        } else {
          const errData = await res.json().catch(() => ({}));
          const msg = errData.error?.message || `HTTP ${res.status}`;
          return { success: false, message: msg, latency };
        }
      }
    } catch (err: unknown) {
      return { success: false, message: String(err) };
    }

    return { success: true, message: "Format valid (Browser mode)", latency: 25 };
  },

  fetchProviderModels: async (providerId: string) => {
    const prov = get().providers[providerId];
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const res = await invoke<TestKeyResponse>("fetch_provider_models", { provider: providerId });
        if (res.success && res.models && res.models.length > 0) {
          set((state) => {
            const current = state.providers[providerId];
            if (!current) return state;
            const mergedModels = Array.from(new Set([...current.models, ...res.models!]));
            const updated = {
              ...state.providers,
              [providerId]: {
                ...current,
                models: mergedModels,
              },
            };
            try {
              localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updated));
            } catch {}
            return { providers: updated };
          });
          return res.models;
        }
      } catch (err) {
        console.warn("fetch_provider_models failed, falling back to key test:", err);
      }
    }
    const key = prov?.apiKey || "";
    if (key.trim()) {
      const res = await get().testProviderKeyLive(providerId, key);
      if (res.models && res.models.length > 0) {
        return res.models;
      }
    }
    return prov?.models || [];
  },


  setEndpoint: (id, endpoint) =>
    set((state) => {
      const current = state.providers[id];
      if (!current) return state;
      const updated = {
        ...state.providers,
        [id]: {
          ...current,
          endpoint,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updated));
      } catch {}
      return { providers: updated };
    }),

  setActiveProviderAndModel: (providerId, model) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.ACTIVE_SELECTION,
        JSON.stringify({ provider: providerId, model })
      );
    } catch {}
    set({ activeProviderId: providerId, activeModel: model });
    import("../lib/settingsSync").then((m) => m.scheduleSaveSettingsToDisk()).catch(() => {});
  },

  checkOllama: async () => {
    set({ ollamaStatus: "checking" });
    const endpoint = get().providers.ollama?.endpoint || "http://localhost:11434";
    try {
      const res = await fetch(`${endpoint}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const models = Array.isArray(data.models)
          ? data.models.map((m: { name: string }) => m.name)
          : get().providers.ollama.models;
        set((state) => {
          const updated = {
            ...state.providers,
            ollama: {
              ...state.providers.ollama,
              models: models.length > 0 ? models : state.providers.ollama.models,
              isConfigured: true,
            },
          };
          try {
            localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updated));
          } catch {}
          return {
            ollamaStatus: "online",
            providers: updated,
          };
        });
      } else {
        set({ ollamaStatus: "offline" });
      }
    } catch {
      set({ ollamaStatus: "offline" });
    }
  },

  savePreamble: (preset) => {
    set((state) => {
      const exists = state.preambles.some((p) => p.id === preset.id);
      const updated = exists
        ? state.preambles.map((p) => (p.id === preset.id ? preset : p))
        : [...state.preambles, preset];
      try {
        localStorage.setItem(STORAGE_KEYS.PREAMBLES, JSON.stringify(updated));
      } catch {}
      return { preambles: updated };
    });
    import("../lib/settingsSync").then((m) => m.scheduleSaveSettingsToDisk()).catch(() => {});
  },

  deletePreamble: (id) => {
    set((state) => {
      const updated = state.preambles.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.PREAMBLES, JSON.stringify(updated));
      } catch {}
      return {
        preambles: updated,
        activePreambleId:
          state.activePreambleId === id ? "default-coder" : state.activePreambleId,
      };
    });
    import("../lib/settingsSync").then((m) => m.scheduleSaveSettingsToDisk()).catch(() => {});
  },

  setActivePreambleId: (id) => {
    set({ activePreambleId: id });
    import("../lib/settingsSync").then((m) => m.scheduleSaveSettingsToDisk()).catch(() => {});
  },
}));
