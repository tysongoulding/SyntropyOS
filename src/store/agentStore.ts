import { create } from "zustand";

export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  defaultTools: string[];
  temperature: number;
  thinkingLevel: "off" | "low" | "medium" | "high" | "max";

  // Advanced Universal Configuration
  coreDirective?: string;
  targetModel?: string;
  permissionLevel?: "Read-Only" | "Sandboxed" | "Admin" | "Escalate";
  confidenceThreshold?: number;
  maxTokens?: number;
  maxStepRetries?: number;
  latencySlaSeconds?: number;

  // Grounding
  globalRules?: boolean;
  companyRules?: boolean;
  projectRules?: boolean;
  teamRules?: boolean;
  requiredInputs?: string;
  domainMemory?: string;
  targetSchemas?: string;

  // Constraints & Boundaries
  whatToDo?: string;
  whatNotToDo?: string;

  // Execution Flow
  patternType?: "ReAct" | "Planning" | "Reflection" | "Routing" | "Multi-Agent Handoff";
  stepByStepLogic?: string;

  // OKRs
  okrObjective?: string;
  krTargets?: string;

  // Style
  tone?: "Expert" | "Concise" | "Direct" | "Formal" | "Operational";
  formattingRules?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  source: "native" | "mcp";
  mcpServer?: string;
  enabled: boolean;
  requiresApproval: boolean;
}

export const DEFAULT_PERSONAS: AgentPersona[] = [
  {
    id: "coder",
    name: "Coding Agent",
    role: "Full-Stack Software Engineer",
    description: "Specialized in code generation, refactoring, and test-driven development.",
    systemPrompt: "You are an expert coding agent. Write concise, idiomatic, production-grade code.",
    defaultTools: ["read", "write", "edit", "bash"],
    temperature: 0.2,
    thinkingLevel: "high",
    coreDirective: "Deliver production-grade, tested, compile-clean code with zero placeholders.",
    targetModel: "inherit",
    permissionLevel: "Sandboxed",
    confidenceThreshold: 90,
    maxTokens: 4000,
    maxStepRetries: 3,
    latencySlaSeconds: 30,
    globalRules: true,
    projectRules: true,
    teamRules: true,
    patternType: "ReAct",
    tone: "Direct",
  },
  {
    id: "architect",
    name: "Software Architect",
    role: "System Designer & Planner",
    description: "Designs technical specifications, system boundaries, and migration plans.",
    systemPrompt: "You are a software architect. Focus on clean domain boundaries, scalability, and type safety.",
    defaultTools: ["read", "search", "fetch"],
    temperature: 0.3,
    thinkingLevel: "high",
    coreDirective: "Enforce clean domain seams, minimize coupling, and produce actionable specs.",
    targetModel: "pro",
    permissionLevel: "Read-Only",
    confidenceThreshold: 95,
    maxTokens: 8000,
    patternType: "Planning",
    tone: "Formal",
  },
  {
    id: "researcher",
    name: "Deep Researcher",
    role: "Codebase & Web Scout",
    description: "Searches documentation, web resources, and explores dependencies.",
    systemPrompt: "You are a research specialist. Analyze documentation, extract technical truths, and cite sources.",
    defaultTools: ["read", "search", "fetch"],
    temperature: 0.4,
    thinkingLevel: "medium",
    coreDirective: "Ground every claim with verifiable source code references or external URLs.",
    targetModel: "flash",
    permissionLevel: "Read-Only",
    confidenceThreshold: 85,
    patternType: "Reflection",
    tone: "Expert",
  },
  {
    id: "reviewer",
    name: "Code Reviewer",
    role: "Quality & Security Auditor",
    description: "Performs adversarial code reviews, vulnerability checks, and lint enforcement.",
    systemPrompt: "You are a strict code reviewer. Verify correctness, edge cases, performance, and security.",
    defaultTools: ["read", "edit", "bash"],
    temperature: 0.1,
    thinkingLevel: "max",
    coreDirective: "Catch regressions, security leaks, edge cases, and architectural drift.",
    targetModel: "pro",
    permissionLevel: "Sandboxed",
    confidenceThreshold: 95,
    patternType: "Reflection",
    tone: "Concise",
  },
];

export const BUILTIN_TOOLS: ToolDefinition[] = [
  { name: "read", description: "Read file contents with line limits and offsets", source: "native", enabled: true, requiresApproval: false },
  { name: "write", description: "Create or overwrite files on disk", source: "native", enabled: true, requiresApproval: true },
  { name: "edit", description: "Precise text replacement with exact match chunks", source: "native", enabled: true, requiresApproval: true },
  { name: "bash", description: "Execute shell commands in the workspace", source: "native", enabled: true, requiresApproval: true },
  { name: "search", description: "Search web queries and return structured summaries", source: "native", enabled: true, requiresApproval: false },
  { name: "fetch", description: "Fetch and extract readable markdown from URLs", source: "native", enabled: true, requiresApproval: false },
];

interface AgentState {
  activePersonaId: string;
  personas: AgentPersona[];
  tools: ToolDefinition[];
  setActivePersona: (id: string) => void;
  addCustomPersona: (persona: AgentPersona) => void;
  deleteCustomPersona: (id: string) => void;
  toggleTool: (name: string) => void;
  toggleToolApproval: (name: string) => void;
  addMcpTool: (tool: ToolDefinition) => void;
}

const STORAGE_KEY = "rho-lota-custom-agents";

function loadCustomAgents(): AgentPersona[] {
  if (typeof window === "undefined") return DEFAULT_PERSONAS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_PERSONAS;
}

export const useAgentStore = create<AgentState>((set) => ({
  activePersonaId: "coder",
  personas: loadCustomAgents(),
  tools: BUILTIN_TOOLS,

  setActivePersona: (id: string) => set({ activePersonaId: id }),

  addCustomPersona: (persona: AgentPersona) => {
    set((state) => {
      const existing = state.personas.filter((p) => p.id !== persona.id);
      const updated = [...existing, persona];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return { personas: updated, activePersonaId: persona.id };
    });
  },

  deleteCustomPersona: (id: string) => {
    set((state) => {
      const updated = state.personas.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return {
        personas: updated,
        activePersonaId: state.activePersonaId === id ? "coder" : state.activePersonaId,
      };
    });
  },

  toggleTool: (name: string) =>
    set((state) => ({
      tools: state.tools.map((t) =>
        t.name === name ? { ...t, enabled: !t.enabled } : t
      ),
    })),

  toggleToolApproval: (name: string) =>
    set((state) => ({
      tools: state.tools.map((t) =>
        t.name === name ? { ...t, requiresApproval: !t.requiresApproval } : t
      ),
    })),

  addMcpTool: (tool: ToolDefinition) =>
    set((state) => ({ tools: [...state.tools, tool] })),
}));
