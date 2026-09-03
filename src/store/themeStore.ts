import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  border: string;
  accent: string;
  highlight: string;
}

export interface PresetTheme {
  id: string;
  name: string;
  dark: ThemeColors;
  light: ThemeColors;
}

export const THEME_PRESETS: PresetTheme[] = [
  {
    id: "default",
    name: "Syntropy Gradient",
    dark: {
      background: "#0d1117",
      foreground: "#c9d1d9",
      card: "#161b22",
      border: "#30363d",
      accent: "#58a6ff",
      highlight: "#f472b6",
    },
    light: {
      background: "#ffffff",
      foreground: "#24292f",
      card: "#f6f8fa",
      border: "#d0d7de",
      accent: "#58a6ff",
      highlight: "#f472b6",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    dark: {
      background: "#282a36",
      foreground: "#f8f8f2",
      card: "#44475a",
      border: "#6272a4",
      accent: "#bd93f9",
      highlight: "#ff79c6",
    },
    light: {
      background: "#f8f8f2",
      foreground: "#282a36",
      card: "#e8e8e8",
      border: "#6272a4",
      accent: "#bd93f9",
      highlight: "#ff79c6",
    },
  },
  {
    id: "nord",
    name: "Nord Frost",
    dark: {
      background: "#2e3440",
      foreground: "#eceff4",
      card: "#3b4252",
      border: "#4c566a",
      accent: "#88c0d0",
      highlight: "#81a1c1",
    },
    light: {
      background: "#eceff4",
      foreground: "#2e3440",
      card: "#e5e9f0",
      border: "#d8dee9",
      accent: "#5e81ac",
      highlight: "#88c0d0",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    dark: {
      background: "#08090c",
      foreground: "#00f0ff",
      card: "#12151c",
      border: "#ff003c",
      accent: "#ffe600",
      highlight: "#ff003c",
    },
    light: {
      background: "#f0f2f5",
      foreground: "#08090c",
      card: "#ffffff",
      border: "#ff003c",
      accent: "#00f0ff",
      highlight: "#ffe600",
    },
  },
];

interface ThemeState {
  mode: ThemeMode;
  preset: string;
  darkColors: ThemeColors;
  lightColors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  setPreset: (presetId: string) => void;
  setColor: (target: "dark" | "light", key: keyof ThemeColors, value: string) => void;
  resetPreset: (presetId: string) => void;
  initTheme: (data: Partial<{ mode: ThemeMode; preset: string; darkColors: Partial<ThemeColors>; lightColors: Partial<ThemeColors> }>) => void;
}

const STORAGE_KEY = "rho-lota-theme";

function loadInitialState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

const initial = loadInitialState() || {
  mode: "dark" as ThemeMode,
  preset: "default",
  darkColors: THEME_PRESETS[0].dark,
  lightColors: THEME_PRESETS[0].light,
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initial.mode,
  preset: initial.preset,
  darkColors: { ...THEME_PRESETS[0].dark, ...initial.darkColors },
  lightColors: { ...THEME_PRESETS[0].light, ...initial.lightColors },

  setMode: (mode: ThemeMode) => {
    set({ mode });
    persist(get());
    applyThemeToDocument();
  },

  setPreset: (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      set({
        preset: presetId,
        darkColors: { ...found.dark },
        lightColors: { ...found.light },
      });
      persist(get());
      applyThemeToDocument();
    }
  },

  setColor: (target, key, value) => {
    set((state) => ({
      preset: "custom",
      ...(target === "dark"
        ? { darkColors: { ...state.darkColors, [key]: value } }
        : { lightColors: { ...state.lightColors, [key]: value } }),
    }));
    persist(get());
    applyThemeToDocument();
  },

  resetPreset: (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      set({
        preset: presetId,
        darkColors: { ...found.dark },
        lightColors: { ...found.light },
      });
      persist(get());
      applyThemeToDocument();
    }
  },

  initTheme: (data) => {
    set((state) => ({
      mode: data.mode ?? state.mode,
      preset: data.preset ?? state.preset,
      darkColors: data.darkColors ? { ...state.darkColors, ...data.darkColors } : state.darkColors,
      lightColors: data.lightColors ? { ...state.lightColors, ...data.lightColors } : state.lightColors,
    }));
    applyThemeToDocument();
  },
}));

function persist(state: ThemeState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode: state.mode,
        preset: state.preset,
        darkColors: state.darkColors,
        lightColors: state.lightColors,
      })
    );
    import("../lib/settingsSync").then((m) => m.scheduleSaveSettingsToDisk()).catch(() => {});
  } catch {}
}

export function applyThemeToDocument() {
  if (typeof window === "undefined") return;
  const state = useThemeStore.getState();
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = state.mode === "system" ? systemPrefersDark : state.mode === "dark";

  const root = document.documentElement;
  const colors = isDark ? state.darkColors : state.lightColors;

  if (isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }

  root.style.setProperty("--bg-main", colors.background);
  root.style.setProperty("--bg-card", colors.card);
  root.style.setProperty("--text-main", colors.foreground);
  root.style.setProperty("--border-main", colors.border);
  root.style.setProperty("--color-accent", colors.accent);
  root.style.setProperty("--color-highlight", colors.highlight || colors.accent);
}
