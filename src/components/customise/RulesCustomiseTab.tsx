import { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  Save,
  Sliders,
  Cpu,
  Sparkles,
  Code2,
  Eye,
  RotateCcw,
  Bot,
  Layers,
  Route,
  Zap,
  Lock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
} from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import { MarkviewRenderer } from "../markdown/MarkviewRenderer";
import { useAgentStore, AgentPersona } from "../../store/agentStore";
import { invoke } from "@tauri-apps/api/core";

const DEFAULT_SYSTEM_MD = `# Rho Lota System Core Protocol

You are the Rho Lota autonomous coding assistant powered by Rust \`rho-engine\` and Rig core.

## Core Directives
1. **Direct Output**: Start immediately with the solution, script, or executable code block. Never include conversational greetings or filler.
2. **Absolute Brevity**: If a single line answers the prompt, provide only that.
3. **Evidence-First Context Discovery**: Inspect project structure and configuration files before modifying files.
4. **Targeted Modifications**: Prefer precise incremental edits over full-file rewrites.
5. **Strict Red-First TDD**: Author tests first, verify red failure, then implement minimal production code to pass green.
6. **Code Structure**: Keep files concise (~150 lines target). Split along natural cohesion boundaries.
7. **Lint Policy**: Zero tolerance for Clippy lints; never add suppression attributes.`;

const DEFAULT_COMPACTION_MD = `# Context Limit Compaction & Continuation Protocol

## Task Context
- An LLM context limit was reached when a user was in an active working session with an agent.
- Generate a structured continuation checkpoint removing redundant verbose tool outputs while preserving 100% technical fidelity.
- Use framing and tone tailored for the agent to resume execution without loss of state.

## Mandatory Compaction Sections:
1. **User Intent** – All user goals, requests, and UI/architectural directives.
2. **Technical Concepts** – All frameworks, Rig/Rust FSM engines, and MCP protocols.
3. **Files + Code** – Viewed/edited files, complete modified snippets, and justifications.
4. **Errors + Fixes** – Compiler diagnostics, type issues, and applied resolutions.
5. **Problem Solving** – Solved architectural challenges and open design questions.
6. **User Messages** – Chronological history of user requests.
7. **Pending Tasks** – Outstanding unresolved user items.
8. **Current Work** – Exact files and state active at compaction time.
9. **Next Step** – Immediate direct technical command to continue.`;

const DEFAULT_SUBAGENT_SYSTEM_MD = `# Subagent System & Multi-Agent Delegation Protocol

Subagents are specialized autonomous workers invoked via \`invoke_subagent\` running in isolated context threads.

## Workspace Modes
- \`inherit\`: Shares parent working directory directly.
- \`branch\`: Isolated git worktree branched from parent HEAD.
- \`share\`: Shared underlying repository with independent branch pointer.

## Lifecycle & Messaging
- **Reactive Wakeup**: Do NOT poll in a loop. The harness automatically awakens the parent when subagents finish.
- **Communication**: Use \`send_message\` to pass instructions or kill tokens.
- **Role Specialization**: Assign single-responsibility roles (e.g. \`build-implementer\`, \`scout\`, \`red-team-reviewer\`).`;

const DEFAULT_ARTIFACTS_MD = `# Artifact Creation & Presentation Protocol

Artifacts are persistent markdown, HTML, or structured documents saved to \`<appDataDir>/brain/<conversation-id>/\`.

## When to Create Artifacts
- Detailed technical implementation plans (\`implementation_plan.md\`)
- Step-by-step walkthroughs (\`walkthrough.md\`)
- Interactive HTML/Canvas telemetry widgets (\`*.html\`)
- Vector system architecture diagrams (\`*.svg\`)
- Database schemas and migration scripts (\`*.sql\`)

## Formatting Invariants
- **GitHub Alerts**: Use \`> [!NOTE]\`, \`> [!TIP]\`, \`> [!IMPORTANT]\`, \`> [!WARNING]\`, and \`> [!CAUTION]\`.
- **KaTeX LaTeX**: Use \`$...\` for inline math and \`$$...$$\` for block formulas.
- **80% Viewport Preview**: HTML artifacts render dynamically in sandboxed iframes.`;

const DEFAULT_AUTOMATION_MD = `# Dynamic Automation, Tool Execution & MCP Protocol

Defines execution permissions, background daemons, MCP sidecars, and automated scheduled triggers.

## Tool Registry & Sandboxing
- **Native Tools**: \`read_file\`, \`write_to_file\`, \`replace_file_content\`, \`run_command\`, \`schedule\`.
- **MCP Protocol**: Lazy-load JSON schemas for external servers (GitHub, Context-Mode, Google-Workspace).
- **Command Efficiency**: Proactively chain related shell commands (e.g. \`cargo fmt; cargo clippy\`).

## Background Daemons & Timers
- Use \`schedule\` tool for one-shot timers or recurring cron triggers.
- Never execute blocking sleep commands in shell.`;

const STORAGE_KEY = "syntropy_rules_customise_v4";

interface PromptConfigDto {
  role: string;
  is_custom: boolean;
  display_status: string;
  prompt_content: string;
}

export function RulesCustomiseTab() {
  const { addToast } = useToastStore();
  const { personas, addPersona, updatePersona } = useAgentStore();

  const [activeRuleId, setActiveRuleId] = useState<string>("arch_sme");
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [compactingPercent, setCompactingPercent] = useState<number>(85);
  const [compactingEngine, setCompactingEngine] = useState<string>("rig.rs");

  // Prompt Protection state for active agent
  const [promptProtection, setPromptProtection] = useState<PromptConfigDto>({
    role: "arch_sme",
    is_custom: false,
    display_status: "Defaulted",
    prompt_content: "",
  });
  const [savingPrompt, setSavingPrompt] = useState(false);

  // New Agent Modal state
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [newAgentTier, setNewAgentTier] = useState<"fast_tier" | "reasoning_lead">("fast_tier");
  const [newAgentProduces, setNewAgentProduces] = useState("");
  const [newAgentProhibits, setNewAgentProhibits] = useState("");

  const [prompts, setPrompts] = useState<{ [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      system: DEFAULT_SYSTEM_MD,
      compaction: DEFAULT_COMPACTION_MD,
      subagent: DEFAULT_SUBAGENT_SYSTEM_MD,
      artifacts: DEFAULT_ARTIFACTS_MD,
      automation: DEFAULT_AUTOMATION_MD,
      global: `# General Instructions
- Direct Output: Start immediately with the solution, script, or code block.
- Absolute Brevity: If a single line answers the prompt, provide only that.
- Target Modifications: Prefer precise, incremental edits over full-file rewrites.
- Closed Loop Validation: Validate syntax and run checks locally before declaring complete.
- No Placeholders: Never emit // TODO or left-as-an-exercise placeholders.`,
      project: `# Repository Instructions
- Keep files concise (~150 lines target). Treat growth beyond ~150 lines as a signal to check cohesion.
- Separate unit tests into sibling tests.rs or tests/ submodules.
- Lint Policy: Do not add Clippy allow, expect, or crate-level lint suppressions.
- Testing: Use cargo test --workspace for verified feedback.`,
      company: `# Company Compliance & Governance
- Security: Never commit API keys, cloud secrets, or access tokens.
- Privacy: Strip internal hostnames, private IPs, and proprietary credentials before git push.`,
      team: `# Team Workflow & Defect Prevention
- TDD Discipline: Strict red-to-green verification before declaring task done.
- Defect Catalog: Review known regression classes in memory/defect-catalog.md.`,
    };
  });

  // Check if current selection is an agent persona
  const activePersona = personas.find((p) => p.id === activeRuleId);

  // Load Prompt Protection config whenever an agent is selected
  useEffect(() => {
    if (activePersona) {
      const loadConfig = async () => {
        try {
          const res = await invoke<PromptConfigDto>("get_prompt_config", {
            role: activePersona.id,
          });
          setPromptProtection(res);
          if (res.is_custom && res.prompt_content) {
            setPrompts((prev) => ({ ...prev, [activePersona.id]: res.prompt_content }));
          }
        } catch {
          // Fallback mock
          setPromptProtection({
            role: activePersona.id,
            is_custom: activePersona.promptProtectionMode === "Custom",
            display_status: activePersona.promptProtectionMode || "Defaulted",
            prompt_content: activePersona.systemPrompt,
          });
        }
      };
      loadConfig();
    }
  }, [activePersona?.id]);

  const handleTogglePromptProtection = async (toCustom: boolean) => {
    if (!activePersona) return;
    setSavingPrompt(true);
    try {
      if (toCustom) {
        const textToActivate =
          prompts[activePersona.id] ||
          `# Custom System Instructions for ${activePersona.name}\n\nSpecify customized domain rules...`;
        await invoke("save_custom_prompt", {
          role: activePersona.id,
          content: textToActivate,
          activate: true,
        });
        setPromptProtection({
          role: activePersona.id,
          is_custom: true,
          display_status: "Custom",
          prompt_content: textToActivate,
        });
        setPrompts((prev) => ({ ...prev, [activePersona.id]: textToActivate }));
        updatePersona(activePersona.id, { promptProtectionMode: "Custom" });
        addToast(`Switched ${activePersona.name} to Custom (User Editable) mode`, "success");
      } else {
        await invoke("save_custom_prompt", {
          role: activePersona.id,
          content: "",
          activate: false,
        });
        setPromptProtection({
          role: activePersona.id,
          is_custom: false,
          display_status: "Defaulted",
          prompt_content: "",
        });
        updatePersona(activePersona.id, { promptProtectionMode: "Defaulted" });
        addToast(`Reverted ${activePersona.name} to opaque Defaulted (Proprietary) mode`, "success");
      }
    } catch (e: any) {
      addToast(`Error toggling prompt mode: ${e}`, "error");
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleCreateAgent = () => {
    if (!newAgentName.trim() || !newAgentId.trim()) {
      addToast("Please specify both an Agent Name and ID", "error");
      return;
    }

    const cleanId = newAgentId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const newP: AgentPersona = {
      id: cleanId,
      name: newAgentName,
      role: newAgentRole || "Domain Specialist",
      description: "Custom user-defined agent persona with specialized instructions and props.",
      systemPrompt: newAgentPrompt || `# System Instructions for ${newAgentName}\n\nDeliver robust, tested outputs.`,
      defaultTools: ["read", "write", "search"],
      temperature: 0.2,
      thinkingLevel: "medium",
      promptProtectionMode: "Custom",
      invariants: {
        produces: newAgentProduces.split(",").map((s) => s.trim()).filter(Boolean),
        prohibits: newAgentProhibits.split(",").map((s) => s.trim()).filter(Boolean),
        assumes: [],
      },
    };

    addPersona(newP);
    setPrompts((prev) => ({ ...prev, [cleanId]: newP.systemPrompt }));
    setActiveRuleId(cleanId);
    setShowNewAgentModal(false);
    setNewAgentName("");
    setNewAgentId("");
    setNewAgentRole("");
    setNewAgentPrompt("");
    setNewAgentProduces("");
    setNewAgentProhibits("");
    addToast(`Agent persona '${newP.name}' created successfully`, "success");
  };

  const ruleCategories = [
    {
      groupTitle: "Agent Personas, Roles & Prompts",
      isAgentGroup: true,
      items: personas.map((p) => ({
        id: p.id,
        name: p.name,
        roleDesc: p.role,
        icon: Bot,
        file: `crates/syntropy-engine/prompts/proprietary/${p.id}.md`,
        isAgent: true,
        tokens: p.systemPrompt.length > 0 ? Math.round(p.systemPrompt.length / 4) : 400,
        isCustom: p.promptProtectionMode === "Custom",
        defaultText: p.systemPrompt,
      })),
    },
    {
      groupTitle: "Core Engine System Prompts",
      items: [
        {
          id: "system",
          name: "SYSTEM.md",
          icon: Zap,
          file: "crates/syntropy-engine/prompts/SYSTEM.md",
          tokens: 380,
          defaultText: DEFAULT_SYSTEM_MD,
        },
        {
          id: "compaction",
          name: "COMPACTION.md",
          icon: Cpu,
          file: "crates/syntropy-engine/prompts/COMPACTION.md",
          tokens: 310,
          defaultText: DEFAULT_COMPACTION_MD,
        },
        {
          id: "subagent",
          name: "SUBAGENT_SYSTEM.md",
          icon: Users,
          file: "crates/syntropy-engine/prompts/SUBAGENT_SYSTEM.md",
          tokens: 290,
          defaultText: DEFAULT_SUBAGENT_SYSTEM_MD,
        },
        {
          id: "artifacts",
          name: "ARTIFACTS.md",
          icon: Layers,
          file: "crates/syntropy-engine/prompts/ARTIFACTS.md",
          tokens: 260,
          defaultText: DEFAULT_ARTIFACTS_MD,
        },
        {
          id: "automation",
          name: "AUTOMATION.md",
          icon: Route,
          file: "crates/syntropy-engine/prompts/AUTOMATION.md",
          tokens: 280,
          defaultText: DEFAULT_AUTOMATION_MD,
        },
      ],
    },
    {
      groupTitle: "Layered Rule Directives",
      items: [
        {
          id: "global",
          name: "@GLOBAL-RULES",
          icon: Shield,
          file: "~/.gemini/GEMINI.md",
          tokens: 420,
          defaultText: prompts.global,
        },
        {
          id: "project",
          name: "@PROJECT-RULES",
          icon: Shield,
          file: "AGENTS.md",
          tokens: 580,
          defaultText: prompts.project,
        },
        {
          id: "company",
          name: "@COMPANY-RULES",
          icon: Shield,
          file: "templates/company-rules.md",
          tokens: 150,
          defaultText: prompts.company,
        },
        {
          id: "team",
          name: "@TEAM-RULES",
          icon: Shield,
          file: "templates/team-rules.md",
          tokens: 190,
          defaultText: prompts.team,
        },
      ],
    },
  ];

  const allItems = ruleCategories.flatMap((g) => g.items);
  const selectedRule = allItems.find((r) => r.id === activeRuleId) || allItems[0];

  const handleTextChange = (val: string) => {
    setPrompts((prev) => ({ ...prev, [selectedRule.id]: val }));
    if (activePersona) {
      updatePersona(activePersona.id, { systemPrompt: val });
    }
  };

  const handleSave = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
      if (activePersona && promptProtection.is_custom) {
        await invoke("save_custom_prompt", {
          role: activePersona.id,
          content: prompts[selectedRule.id] || "",
          activate: true,
        });
      }
      addToast(`Saved & updated ${selectedRule.name}`, "success");
    } catch {
      addToast("Failed to save rules", "error");
    }
  };

  const handleReset = () => {
    setPrompts((prev) => ({ ...prev, [selectedRule.id]: selectedRule.defaultText }));
    addToast(`Reset ${selectedRule.name} to template`, "info");
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 max-w-7xl mx-auto text-xs text-[#c9d1d9]">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#58a6ff]" />
            <span>Agent Personas, System Prompts &amp; Layered Rules</span>
          </h2>
          <p className="text-[#8b949e]">
            Create and govern agent personas, invariant contracts, dual-mode prompt protection, and core execution directives.
          </p>
        </div>

        <button
          onClick={() => setShowNewAgentModal(true)}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#58a6ff] to-[#f472b6] text-white font-semibold text-xs flex items-center space-x-1.5 transition hover:opacity-90 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Agent Persona</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Rule & Agent Selector Sidebar */}
        <div className="space-y-4 md:col-span-1">
          {ruleCategories.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">
                  {group.groupTitle}
                </span>
                {group.isAgentGroup && (
                  <button
                    onClick={() => setShowNewAgentModal(true)}
                    className="text-[10px] text-[#58a6ff] hover:text-white flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {group.items.map((rule) => {
                  const isSelected = activeRuleId === rule.id;
                  const Icon = rule.icon;
                  return (
                    <button
                      key={rule.id}
                      onClick={() => setActiveRuleId(rule.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? "bg-gradient-to-r from-[#58a6ff]/20 to-[#f472b6]/20 border-[#f472b6]/40 text-white font-medium"
                          : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-[#58a6ff]" : "text-[#8b949e]"}`} />
                        <div className="truncate">
                          <div className="font-mono text-xs font-semibold truncate text-white">
                            {rule.name}
                          </div>
                          <div className="text-[9px] text-[#8b949e] truncate">
                            {"roleDesc" in rule ? (rule as any).roleDesc : rule.file}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {"isAgent" in rule && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                              (rule as any).isCustom
                                ? "bg-[#f472b6]/10 text-[#f472b6] border-[#f472b6]/30"
                                : "bg-[#58a6ff]/10 text-[#58a6ff] border-[#58a6ff]/30"
                            }`}
                          >
                            {(rule as any).isCustom ? "Custom" : "Default"}
                          </span>
                        )}
                        <span className="font-mono text-[9px] text-[#8b949e]">
                          ~{rule.tokens}t
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Editor & Persona Details Panel */}
        <div className="md:col-span-3 bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col space-y-4 min-h-[550px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#30363d] pb-3">
            <div className="flex items-center space-x-2">
              <selectedRule.icon className="w-4 h-4 text-[#58a6ff]" />
              <span className="font-semibold text-white text-xs font-mono">{selectedRule.name}</span>
              <span className="font-mono text-[10px] text-[#8b949e]">({selectedRule.file})</span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mode Toggle */}
              <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5 space-x-0.5">
                <button
                  onClick={() => setEditorMode("edit")}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    editorMode === "edit"
                      ? "bg-gradient-to-r from-[#58a6ff] to-[#f472b6] text-white"
                      : "text-[#8b949e] hover:text-white"
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>Editor</span>
                </button>
                <button
                  onClick={() => setEditorMode("preview")}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    editorMode === "preview"
                      ? "bg-gradient-to-r from-[#58a6ff] to-[#f472b6] text-white"
                      : "text-[#8b949e] hover:text-white"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>MarkView</span>
                </button>
              </div>

              {/* Reset to Example */}
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d] transition"
                title="Reset to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={savingPrompt}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#58a6ff] to-[#f472b6] text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow hover:opacity-90 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Agent Persona Properties & Invariants Card (When an agent persona is selected) */}
          {activePersona && (
            <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-xs">{activePersona.role}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b22] text-[#58a6ff] border border-[#30363d]">
                      {activePersona.targetModel === "flash" ? "90% Fast Tier" : "10% Reasoning Lead"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-0.5">{activePersona.description}</p>
                </div>

                {/* Prompt Protection Dual-Mode Selector */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-[#161b22] border border-[#30363d] p-1 rounded-lg">
                    <button
                      onClick={() => handleTogglePromptProtection(false)}
                      disabled={savingPrompt || !promptProtection.is_custom}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono transition ${
                        !promptProtection.is_custom
                          ? "bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 font-semibold"
                          : "text-[#8b949e] hover:text-white"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Defaulted (Proprietary)</span>
                    </button>
                    <button
                      onClick={() => handleTogglePromptProtection(true)}
                      disabled={savingPrompt || promptProtection.is_custom}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono transition ${
                        promptProtection.is_custom
                          ? "bg-[#f472b6]/20 text-[#f472b6] border border-[#f472b6]/40 font-semibold"
                          : "text-[#8b949e] hover:text-white"
                      }`}
                    >
                      <span>Custom (Editable)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Invariants: Produces vs Prohibits vs Assumes */}
              <div className="pt-2 border-t border-[#21262d] flex flex-wrap items-center gap-3 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#8b949e]">Produces:</span>
                  {(activePersona.invariants?.produces || ["deliverable_spec"]).map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff]">
                      +{p}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#8b949e]">Prohibits:</span>
                  {(activePersona.invariants?.prohibits || []).length > 0 ? (
                    activePersona.invariants?.prohibits.map((pr) => (
                      <span key={pr} className="px-1.5 py-0.5 rounded bg-[#f472b6]/10 text-[#f472b6]">
                        !{pr}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#8b949e] italic">none</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#8b949e]">Assumes:</span>
                  {(activePersona.invariants?.assumes || []).length > 0 ? (
                    activePersona.invariants?.assumes.map((a) => (
                      <span key={a} className="px-1.5 py-0.5 rounded bg-[#21262d] text-[#c9d1d9]">
                        @{a}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#8b949e] italic">none</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Compaction Controls (when COMPACTION.md is active) */}
          {selectedRule.id === "compaction" && (
            <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span className="font-semibold text-white text-xs">Compaction Trigger Threshold</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#58a6ff]">
                  {compactingPercent}% of Context Window
                </span>
              </div>

              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={compactingPercent}
                onChange={(e) => setCompactingPercent(Number(e.target.value))}
                className="w-full accent-[#58a6ff] bg-[#161b22] rounded-lg h-2 cursor-pointer"
              />
            </div>
          )}

          {/* Body: Protected Defaulted View OR Markdown Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            {activePersona && !promptProtection.is_custom ? (
              /* Defaulted Protected Mode */
              <div className="flex-1 p-8 rounded-xl bg-[#0d1117] border border-[#30363d] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-sm font-semibold text-white">[ Defaulted (Proprietary Engine) ]</h3>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    This agent role uses proprietary system instructions compiled into the native Rust binary.
                    Monitored by Canary UUID tripwires, wrapped in Dynamic Nonces, and memory-scrubbed via Zeroizing.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-[#58a6ff] bg-[#161b22] px-3 py-1 rounded border border-[#30363d]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>3-Vector Defense Active • Opaque from IPC</span>
                </div>
                <button
                  onClick={() => handleTogglePromptProtection(true)}
                  disabled={savingPrompt}
                  className="px-4 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-white transition"
                >
                  Switch to Custom (Editable) Prompt
                </button>
              </div>
            ) : editorMode === "edit" ? (
              <textarea
                rows={16}
                value={prompts[selectedRule.id] || ""}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-white font-mono text-xs leading-relaxed outline-none focus:border-[#58a6ff] resize-none overflow-y-auto select-text"
                spellCheck={false}
                placeholder="Specify Markdown system prompt instructions..."
              />
            ) : (
              <div className="flex-1 overflow-y-auto bg-[#0d1117] border border-[#30363d] rounded-xl p-5">
                <MarkviewRenderer content={prompts[selectedRule.id] || ""} showLineNumbers={false} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Agent Persona Creation Modal */}
      {showNewAgentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-[#58a6ff]" />
                <h3 className="font-semibold text-white text-sm">Create New Agent Persona &amp; Prompt</h3>
              </div>
              <button
                onClick={() => setShowNewAgentModal(false)}
                className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8b949e] block mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={(e) => {
                      setNewAgentName(e.target.value);
                      if (!newAgentId) {
                        setNewAgentId(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                      }
                    }}
                    placeholder="e.g. Database Architect"
                    className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:border-[#58a6ff] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Role ID (snake_case)</label>
                  <input
                    type="text"
                    value={newAgentId}
                    onChange={(e) => setNewAgentId(e.target.value)}
                    placeholder="e.g. db_sme"
                    className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-white font-mono focus:border-[#58a6ff] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">Role Description / Title</label>
                <input
                  type="text"
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder="e.g. High-throughput PostgreSQL & Redis schema engineer"
                  className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:border-[#58a6ff] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8b949e] block mb-1">Produces Invariants (comma-sep)</label>
                  <input
                    type="text"
                    value={newAgentProduces}
                    onChange={(e) => setNewAgentProduces(e.target.value)}
                    placeholder="e.g. sql_migrations, db_indexes"
                    className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-white font-mono text-[11px] focus:border-[#58a6ff] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Prohibits Invariants (comma-sep)</label>
                  <input
                    type="text"
                    value={newAgentProhibits}
                    onChange={(e) => setNewAgentProhibits(e.target.value)}
                    placeholder="e.g. table_drop, unindexed_scans"
                    className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-white font-mono text-[11px] focus:border-[#58a6ff] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">System Prompt / Instructions</label>
                <textarea
                  rows={4}
                  value={newAgentPrompt}
                  onChange={(e) => setNewAgentPrompt(e.target.value)}
                  placeholder="# System Instructions&#10;Define behavioral directives..."
                  className="w-full p-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-white font-mono text-[11px] focus:border-[#58a6ff] outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#30363d]">
              <button
                onClick={() => setShowNewAgentModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#58a6ff] to-[#f472b6] text-white font-semibold text-xs flex items-center space-x-1.5 transition hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Persona &amp; Prompt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
