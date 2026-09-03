import { create } from "zustand";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  customInstructions: string;
  isDefault?: boolean;
  createdAt: string;
}

interface UserState {
  activeUserId: string;
  users: UserProfile[];
  getActiveUser: () => UserProfile;
  addUser: (profile: Partial<UserProfile>) => UserProfile;
  updateUser: (id: string, updates: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;
  switchUser: (id: string) => void;
  initUsers: (data: { activeUserId?: string; users?: UserProfile[] }) => void;
}

const STORAGE_KEY = "rho-lota-users";

const DEFAULT_USER: UserProfile = {
  id: "user-default",
  name: "Tyson Goulding",
  email: "tyson@example.com",
  role: "Principal Systems Architect",
  bio: "Building intelligent local and desktop agentic workflows.",
  customInstructions: "Prefer concise explanations and clean, modular code. Respect project boundaries.",
  isDefault: true,
  createdAt: new Date().toISOString(),
};

function loadInitialUsers(): { activeUserId: string; users: UserProfile[] } {
  if (typeof window === "undefined") {
    return { activeUserId: DEFAULT_USER.id, users: [DEFAULT_USER] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        return {
          activeUserId: parsed.activeUserId || parsed.users[0].id,
          users: parsed.users,
        };
      }
    }
  } catch {}
  return { activeUserId: DEFAULT_USER.id, users: [DEFAULT_USER] };
}

const initial = loadInitialUsers();

export const useUserStore = create<UserState>((set, get) => ({
  activeUserId: initial.activeUserId,
  users: initial.users,

  getActiveUser: () => {
    const { users, activeUserId } = get();
    return users.find((u) => u.id === activeUserId) || users[0] || DEFAULT_USER;
  },

  addUser: (profile) => {
    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: profile.name || "New Developer",
      email: profile.email || "developer@local",
      role: profile.role || "Software Engineer",
      bio: profile.bio || "Building agentic systems",
      customInstructions: profile.customInstructions || "Prefer concise answers.",
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      users: [...state.users, newUser],
      activeUserId: newUser.id,
    }));

    persist(get());
    return newUser;
  },

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }));
    persist(get());
  },

  deleteUser: (id) => {
    const { users, activeUserId } = get();
    if (users.length <= 1) return; // Keep at least one user

    const filtered = users.filter((u) => u.id !== id);
    const nextActive = activeUserId === id ? filtered[0].id : activeUserId;

    set({ users: filtered, activeUserId: nextActive });
    persist(get());
  },

  switchUser: (id) => {
    set({ activeUserId: id });
    persist(get());
  },

  initUsers: (data) => {
    if (data.users && Array.isArray(data.users) && data.users.length > 0) {
      set({
        users: data.users,
        activeUserId: data.activeUserId || data.users[0].id,
      });
    }
  },
}));

function persist(state: { activeUserId: string; users: UserProfile[] }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeUserId: state.activeUserId,
        users: state.users,
      })
    );
    import("../lib/settingsSync").then((m) => m.scheduleSaveSettingsToDisk()).catch(() => {});
  } catch {}
}
