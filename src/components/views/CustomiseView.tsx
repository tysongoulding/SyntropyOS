import { useUiStore, CustomiseTab } from "../../store/uiStore";
import { StartupTokenUsageTab } from "../customise/StartupTokenUsageTab";
import { RulesCustomiseTab } from "../customise/RulesCustomiseTab";
import { AgentInspector } from "../agent/AgentInspector";
import { SkillsCustomiseTab } from "../customise/SkillsCustomiseTab";
import { McpsCustomiseTab } from "../customise/McpsCustomiseTab";
import { PluginsCustomiseTab } from "../customise/PluginsCustomiseTab";
import { Coins, Shield, Bot, Zap, PlugZap, ToyBrick } from "lucide-react";

export function CustomiseView() {
  const { activeCustomiseTab, setActiveCustomiseTab } = useUiStore();

  const tabs: {
    id: CustomiseTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: "tokens", label: "Token Usage", icon: Coins, badge: "Startup" },
    { id: "rules", label: "Rules", icon: Shield },
    { id: "personas", label: "Chat Personas", icon: Bot },
    { id: "skills", label: "Skills", icon: Zap },
    { id: "mcps", label: "MCPs", icon: PlugZap },
    { id: "plugins", label: "Plugins", icon: ToyBrick },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] min-w-0 overflow-hidden text-xs">
      {/* Horizontal Customise Top Menu Bar */}
      <div className="border-b border-[#30363d] bg-[#161b22] px-4 flex items-center space-x-1 overflow-x-auto flex-shrink-0 select-none scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCustomiseTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCustomiseTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition text-xs ${
                isActive
                  ? "border-pink-500 text-white bg-[#0d1117]/40"
                  : "border-transparent text-[#8b949e] hover:text-white hover:bg-[#0d1117]/20"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-pink-400" : "text-[#8b949e]"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0d1117] text-pink-300 border border-pink-900/40">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab View Body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeCustomiseTab === "tokens" && <StartupTokenUsageTab />}
        {activeCustomiseTab === "rules" && <RulesCustomiseTab />}
        {activeCustomiseTab === "personas" && (
          <div className="flex-1 overflow-y-auto p-5">
            <AgentInspector />
          </div>
        )}
        {activeCustomiseTab === "skills" && <SkillsCustomiseTab />}
        {activeCustomiseTab === "mcps" && <McpsCustomiseTab />}
        {activeCustomiseTab === "plugins" && <PluginsCustomiseTab />}
      </div>
    </div>
  );
}
