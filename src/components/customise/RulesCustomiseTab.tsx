import { useState } from "react";
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
} from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import { MarkviewRenderer } from "../markdown/MarkviewRenderer";

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

const STORAGE_KEY = "rho_lota_rules_customise_v3";

export function RulesCustomiseTab() {
  const { addToast } = useToastStore();

  const [activeRuleId, setActiveRuleId] = useState<string>("system");
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");

  const [compactingPercent, setCompactingPercent] = useState<number>(85);
  const [compactingEngine, setCompactingEngine] = useState<string>("rig.rs");

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
- Testing: Use cargo nextest run for fast parallel test feedback.`,
      company: `# Company Compliance & Governance
- Security: Never commit API keys, cloud secrets, or access tokens.
- Privacy: Strip internal hostnames, private IPs, and proprietary credentials before git push.`,
      team: `# Team Workflow & Defect Prevention
- TDD Discipline: Strict red-to-green verification before declaring task done.
- Defect Catalog: Review known regression classes in memory/defect-catalog.md.`,
    };
  });

  const ruleCategories = [
    {
      groupTitle: "Core Engine System Prompts",
      items: [
        {
          id: "system",
          name: "SYSTEM.md",
          icon: Zap,
          file: "crates/rho-engine/prompts/SYSTEM.md",
          tokens: 380,
          color: "text-blue-400",
          defaultText: DEFAULT_SYSTEM_MD,
        },
        {
          id: "compaction",
          name: "COMPACTION.md",
          icon: Cpu,
          file: "crates/rho-engine/prompts/COMPACTION.md",
          tokens: 310,
          color: "text-amber-400",
          defaultText: DEFAULT_COMPACTION_MD,
        },
        {
          id: "subagent",
          name: "SUBAGENT_SYSTEM.md",
          icon: Bot,
          file: "crates/rho-engine/prompts/SUBAGENT_SYSTEM.md",
          tokens: 290,
          color: "text-purple-400",
          defaultText: DEFAULT_SUBAGENT_SYSTEM_MD,
        },
        {
          id: "artifacts",
          name: "ARTIFACTS.md",
          icon: Layers,
          file: "crates/rho-engine/prompts/ARTIFACTS.md",
          tokens: 260,
          color: "text-cyan-400",
          defaultText: DEFAULT_ARTIFACTS_MD,
        },
        {
          id: "automation",
          name: "AUTOMATION.md",
          icon: Route,
          file: "crates/rho-engine/prompts/AUTOMATION.md",
          tokens: 280,
          color: "text-emerald-400",
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
          color: "text-purple-400",
          defaultText: prompts.global,
        },
        {
          id: "project",
          name: "@PROJECT-RULES",
          icon: Shield,
          file: "AGENTS.md",
          tokens: 580,
          color: "text-pink-400",
          defaultText: prompts.project,
        },
        {
          id: "company",
          name: "@COMPANY-RULES",
          icon: Shield,
          file: "templates/company-rules.md",
          tokens: 150,
          color: "text-yellow-400",
          defaultText: prompts.company,
        },
        {
          id: "team",
          name: "@TEAM-RULES",
          icon: Shield,
          file: "templates/team-rules.md",
          tokens: 190,
          color: "text-indigo-400",
          defaultText: prompts.team,
        },
      ],
    },
  ];

  const allItems = ruleCategories.flatMap((g) => g.items);
  const selectedRule = allItems.find((r) => r.id === activeRuleId) || allItems[0];

  const handleTextChange = (val: string) => {
    setPrompts((prev) => ({ ...prev, [selectedRule.id]: val }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
      addToast(`Saved & updated ${selectedRule.name}`, "success");
    } catch {
      addToast("Failed to save rules to localStorage", "error");
    }
  };

  const handleReset = () => {
    setPrompts((prev) => ({ ...prev, [selectedRule.id]: selectedRule.defaultText }));
    addToast(`Reset ${selectedRule.name} to example template`, "info");
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 max-w-6xl mx-auto text-xs text-[#c9d1d9]">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span>Core System Prompts, Directives & Compacting Rules</span>
        </h2>
        <p className="text-[#8b949e]">
          Inspect and customize the 5 core system markdown prompts along with layered workspace rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Rule Selector Sidebar */}
        <div className="space-y-4 md:col-span-1">
          {ruleCategories.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider px-1">
                {group.groupTitle}
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
                          ? "bg-[#1f6feb]/20 border-blue-500 text-white font-medium"
                          : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${rule.color}`} />
                        <div className="truncate">
                          <div className="font-mono text-xs font-semibold truncate text-white">
                            {rule.name}
                          </div>
                          <div className="text-[9px] text-[#8b949e] truncate">{rule.file}</div>
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-[#8b949e] flex-shrink-0">
                        ~{rule.tokens}t
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Rule Editor Panel */}
        <div className="md:col-span-3 bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col space-y-4 min-h-[500px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#30363d] pb-3">
            <div className="flex items-center space-x-2">
              <FileText className={`w-4 h-4 ${selectedRule.color}`} />
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
                      ? "bg-[#1f6feb] text-white"
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
                      ? "bg-[#1f6feb] text-white"
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
                title="Reset to default example"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Compacting Specific Parameters (when COMPACTION.md is active) */}
          {selectedRule.id === "compaction" && (
            <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-white text-xs">Compaction Trigger Threshold</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400">
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
                className="w-full accent-amber-500 bg-[#161b22] rounded-lg h-2 cursor-pointer"
              />

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span className="text-[#8b949e]">Compaction Engine:</span>
                  <select
                    value={compactingEngine}
                    onChange={(e) => setCompactingEngine(e.target.value)}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1 text-white font-mono text-xs outline-none focus:border-amber-500"
                  >
                    <option value="rig.rs">rig.rs (Native Rust Rho-Engine)</option>
                    <option value="goose">goose Context Summarizer</option>
                    <option value="custom">Custom AST Token Compactor</option>
                  </select>
                </div>

                <span className="text-[10px] text-[#8b949e] flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Auto-compacts at {200000 * (compactingPercent / 100)} tokens</span>
                </span>
              </div>
            </div>
          )}

          {/* Body: Editor or MarkView Live Rendered Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            {editorMode === "edit" ? (
              <textarea
                rows={16}
                value={prompts[selectedRule.id] || ""}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-white font-mono text-xs leading-relaxed outline-none focus:border-blue-500 resize-none overflow-y-auto select-text"
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 overflow-y-auto bg-[#0d1117] border border-[#30363d] rounded-xl p-5">
                <MarkviewRenderer content={prompts[selectedRule.id] || ""} showLineNumbers={false} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
