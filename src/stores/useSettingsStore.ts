import { create } from "zustand";
import { SystemStatus } from "@/types/protocol";

interface SettingsStore {
  systemStatus: SystemStatus | null;
  apiKeys: {
    gemini: string;
    anthropic: string;
    openai: string;
    groq: string;
  };
  connectedIntegrations: {
    googleWorkspace: boolean;
    microsoft365: boolean;
  };
  setSystemStatus: (status: SystemStatus) => void;
  setApiKey: (provider: "gemini" | "anthropic" | "openai" | "groq", key: string) => void;
  setIntegrationStatus: (provider: "googleWorkspace" | "microsoft365", connected: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  systemStatus: {
    version: "0.6.0",
    os: "windows",
    app_data_dir: "C:\\Users\\tyson\\AppData\\Roaming\\syntrophyOS",
    extensions_dir: "C:\\Users\\tyson\\.syntrophyOS\\extensions",
    connected_providers: ["gemini", "anthropic"],
    active_workstreams_count: 1,
    total_labor_hours_saved: 42.5,
  },
  apiKeys: {
    gemini: "••••••••••••••••",
    anthropic: "••••••••••••••••",
    openai: "",
    groq: "",
  },
  connectedIntegrations: {
    googleWorkspace: true,
    microsoft365: false,
  },

  setSystemStatus: (status) => set({ systemStatus: status }),
  setApiKey: (provider, key) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
  setIntegrationStatus: (provider, connected) =>
    set((state) => ({
      connectedIntegrations: { ...state.connectedIntegrations, [provider]: connected },
    })),
}));
