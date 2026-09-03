import { useUiStore, SettingsTab } from "../../store/uiStore";
import { GeneralSettings } from "./GeneralSettings";
import { ProfileSettings } from "./ProfileSettings";
import { ApplicationSettings } from "./ApplicationSettings";
import { ToolboxManager } from "../agent/ToolboxManager";
import { StructuredPlanView } from "../artifacts/StructuredPlanView";
import { SessionGraphViewer } from "../dag/SessionGraphViewer";
import { ModelProviderSettingsView } from "./ModelProviderSettingsView";
import { AppearanceSettings } from "./AppearanceSettings";
import { UsageBillingSettings } from "./UsageBillingSettings";
import {
  SlidersHorizontal,
  User,
  Laptop,
  Wrench,
  ListTodo,
  GitBranch,
  Cpu,
  Palette,
  CreditCard,
} from "lucide-react";

export function SettingsHubView() {
  const { activeSettingsTab, setActiveSettingsTab } = useUiStore();

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "general", label: "General", icon: SlidersHorizontal },
    { id: "profile", label: "Profile", icon: User },
    { id: "application", label: "Application", icon: Laptop },
    { id: "tools", label: "Dynamic Tools", icon: Wrench },
    { id: "plans", label: "Plan Tracker", icon: ListTodo },
    { id: "sessions", label: "Session DAG", icon: GitBranch },
    { id: "providers", label: "Providers & Models", icon: Cpu },
    { id: "theme", label: "Theme & Colors", icon: Palette },
    { id: "billing", label: "Usage & Billing", icon: CreditCard },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] min-w-0 overflow-hidden text-xs">
      {/* Horizontal Settings Top Navigation Bar */}
      <div className="border-b border-[#30363d] bg-[#161b22] px-4 flex items-center space-x-1 overflow-x-auto flex-shrink-0 select-none scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-3 border-b-2 font-medium whitespace-nowrap transition text-xs ${
                isActive
                  ? "border-[#58a6ff] text-white bg-[#0d1117]/40"
                  : "border-transparent text-[#8b949e] hover:text-white hover:bg-[#0d1117]/20"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#58a6ff]" : "text-[#8b949e]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View Body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeSettingsTab === "general" && <GeneralSettings />}
        {activeSettingsTab === "profile" && <ProfileSettings />}
        {activeSettingsTab === "application" && <ApplicationSettings />}
        {activeSettingsTab === "tools" && <ToolboxManager />}
        {activeSettingsTab === "plans" && <StructuredPlanView />}
        {activeSettingsTab === "sessions" && <SessionGraphViewer />}
        {activeSettingsTab === "providers" && <ModelProviderSettingsView />}
        {activeSettingsTab === "theme" && <AppearanceSettings />}
        {activeSettingsTab === "billing" && <UsageBillingSettings />}
      </div>
    </div>
  );
}
