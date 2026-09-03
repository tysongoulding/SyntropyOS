import React, { useState } from "react";
import { Zap, Play, Layers, ShieldCheck, ArrowRight, GitFork, Bot, Users, CheckCircle2 } from "lucide-react";
import { useWorkstreamStore } from "@/stores/useWorkstreamStore";
import { invoke } from "@tauri-apps/api/core";

export const WorkstreamsView: React.FC = () => {
  const { workstreams, activeWorkstreamId, setActiveWorkstream, addWorkstream } = useWorkstreamStore();
  const [activeTab, setActiveTab] = useState<"hub" | "board">("hub");
  const [launching, setLaunching] = useState(false);

  const activeWs =
    workstreams.find((w) => w.id === activeWorkstreamId) || workstreams[0];

  const phases = [
    { name: "Understand & Map", id: "Phase 1: Understand & Map" },
    { name: "Sketch & Ideate", id: "Phase 2: Sketch & Ideate" },
    { name: "Decide & Storyboard", id: "Phase 3: Decide & Storyboard" },
    { name: "Prototype & Synthesize", id: "Phase 4: Prototype & Synthesize" },
  ];

  const handleLaunchSprint = async () => {
    setLaunching(true);
    const sprintId = `ws-sprint-${Date.now().toString().slice(-4)}`;
    const sprintName = "1-Hour Autonomous Sprint";

    try {
      await invoke("execute_command", {
        cmd: {
          command: "launch_workstream",
          blueprint_id: "1hour-sprint",
          workstream_name: sprintName,
          params: {},
        },
      });
    } catch {
      // Browser preview fallback
    }

    addWorkstream({
      id: sprintId,
      name: sprintName,
      blueprintId: "1hour-sprint",
      status: "running",
      currentPhase: "Phase 1: Understand & Map",
      tasks: [
        {
          id: `${sprintId}-t1`,
          agentId: "sme_research",
          role: "Research Specialist",
          phase: "Understand & Map",
          status: "running",
          streamOutput: "Ingesting directive specifications... Mapping user journeys into Blackboard.",
        },
        {
          id: `${sprintId}-t2`,
          agentId: "sme_architect",
          role: "Lead Architect",
          phase: "Sketch & Ideate",
          status: "pending",
          streamOutput: "",
        },
      ],
      artifacts: [
        {
          uri: `blackboard://${sprintId}/team-research/sme_research/user_journey@v1`,
          author_id: "sme_research",
          title: "User Journey & Architecture Map",
          content: "# User Journey Map\nSynthesized by autonomous SME federation with zero-trust write ACLs.",
          mime_type: "text/markdown",
          version: 1,
          hash: "e829c...11a",
          created_at: new Date().toISOString(),
        },
      ],
    });

    setActiveTab("board");
    setLaunching(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-[#c9d1d9] animate-in fade-in duration-200">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#f472b6] flex items-center justify-center shadow-sm">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Workstream Federations & 1-Hour Sprints
            </h1>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Deploy, govern, and monitor 4-tier autonomous agent federations with decoupled Blackboard stores.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#161b22] border border-[#30363d] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("hub")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "hub"
                ? "bg-gradient-to-r from-[#58a6ff] to-[#f472b6] text-white shadow-sm"
                : "text-[#8b949e] hover:text-white"
            }`}
          >
            Blueprint Hub
          </button>
          <button
            onClick={() => setActiveTab("board")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "board"
                ? "bg-gradient-to-r from-[#58a6ff] to-[#f472b6] text-white shadow-sm"
                : "text-[#8b949e] hover:text-white"
            }`}
          >
            Execution Kanban
          </button>
        </div>
      </div>

      {activeTab === "hub" ? (
        <div className="space-y-6">
          {/* Featured 1-Hour Sprint Card with Gradient Glow */}
          <div className="relative rounded-2xl p-6 bg-[#161b22] border border-[#30363d] overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#58a6ff]/10 to-[#f472b6]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-[#58a6ff]/20 to-[#f472b6]/20 text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] to-[#f472b6] border border-[#f472b6]/30 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#f472b6] fill-[#f472b6]" />
                    Flagship 60-Minute SLA Blueprint
                  </span>
                  <span className="text-xs text-[#8b949e]">Zero Groupthink • O(1) Signal Bus</span>
                </div>

                <h2 className="text-2xl font-bold text-white tracking-tight">
                  1-Hour Autonomous Agentic Sprint
                </h2>

                <p className="text-xs text-[#c9d1d9] leading-relaxed">
                  Deploys a decoupled 4-tier federation (<span className="text-[#58a6ff] font-medium">Federation</span> &gt; <span className="text-[#f472b6] font-medium">Workstream</span> &gt; <span className="text-[#58a6ff] font-medium">Team</span> &gt; <span className="text-[#f472b6] font-medium">SME</span>). SMEs execute blind parallel discovery across 4 rigid phases to deliver an actionable TeamPlan without conversation transcript cascading.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                    <span className="text-[#58a6ff] font-semibold block text-[10px] uppercase">Phase 1 (00-15m)</span>
                    <span className="text-white font-medium">Understand & Map</span>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Research SMEs</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                    <span className="text-[#f472b6] font-semibold block text-[10px] uppercase">Phase 2 (15-30m)</span>
                    <span className="text-white font-medium">Sketch & Ideate</span>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Architect SMEs</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                    <span className="text-[#58a6ff] font-semibold block text-[10px] uppercase">Phase 3 (30-45m)</span>
                    <span className="text-white font-medium">Decide & Storyboard</span>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Team PM & Evaluators</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                    <span className="text-[#f472b6] font-semibold block text-[10px] uppercase">Phase 4 (45-60m)</span>
                    <span className="text-white font-medium">Prototype & Synthesize</span>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Builders & QA</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLaunchSprint}
                disabled={launching}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#58a6ff] to-[#f472b6] hover:opacity-95 active:scale-95 text-white font-semibold text-xs flex items-center space-x-2 transition shadow-lg shadow-pink-950/50 disabled:opacity-50 shrink-0"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{launching ? "Dispatching..." : "Launch 1-Hour Sprint"}</span>
              </button>
            </div>
          </div>

          {/* Active Deployments */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#58a6ff]" />
              <span>Active Workstream Deployments</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {workstreams.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkstream(ws.id);
                    setActiveTab("board");
                  }}
                  className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#f472b6]/60 cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-white group-hover:text-[#58a6ff] transition">
                      {ws.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f472b6]/10 text-[#f472b6] border border-[#f472b6]/30 uppercase">
                      {ws.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#8b949e] flex items-center justify-between">
                    <span>{ws.currentPhase}</span>
                    <span className="text-[11px] text-[#58a6ff] flex items-center space-x-1 group-hover:translate-x-0.5 transition">
                      <span>{ws.tasks.length} SMEs Active</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Execution Kanban Board */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#161b22] border border-[#30363d] text-xs">
            <div className="flex items-center space-x-2 text-[#8b949e]">
              <GitFork className="w-4 h-4 text-[#58a6ff]" />
              <span className="text-white font-semibold">Hierarchy:</span>
              <span className="px-2 py-0.5 rounded bg-[#0d1117] text-[#c9d1d9]">Global Federation</span>
              <span>&gt;</span>
              <span className="px-2 py-0.5 rounded bg-[#0d1117] text-[#58a6ff] border border-[#58a6ff]/40 font-medium">
                {activeWs?.name}
              </span>
              <span>&gt;</span>
              <span className="px-2 py-0.5 rounded bg-[#0d1117] text-[#f472b6] font-medium">Core Team</span>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-[#8b949e]">Asymmetric Routing:</span>
              <span className="px-2 py-0.5 rounded bg-blue-950/40 text-[#58a6ff] border border-blue-800/40 font-mono">
                90% SME Fast
              </span>
              <span className="px-2 py-0.5 rounded bg-pink-950/40 text-[#f472b6] border border-pink-800/40 font-mono">
                10% Reasoning Lead
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {phases.map((phase) => {
              const tasksInPhase = activeWs?.tasks.filter((t) => t.phase.includes(phase.name)) || [];

              return (
                <div
                  key={phase.id}
                  className="bg-[#161b22]/70 border border-[#30363d] rounded-2xl p-3.5 flex flex-col min-h-[500px]"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#30363d]">
                    <span className="font-semibold text-xs text-white">{phase.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0d1117] text-[#8b949e]">
                      {tasksInPhase.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {tasksInPhase.length === 0 ? (
                      <div className="h-32 border border-dashed border-[#30363d] rounded-xl flex items-center justify-center text-[11px] text-[#8b949e] italic">
                        Phase queued
                      </div>
                    ) : (
                      tasksInPhase.map((task) => (
                        <div
                          key={task.id}
                          className="bg-[#0d1117] border border-[#30363d] hover:border-[#f472b6]/50 rounded-xl p-3 space-y-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <Bot className="w-3.5 h-3.5 text-[#f472b6]" />
                              <span className="font-semibold text-xs text-white">{task.role}</span>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase bg-blue-950/40 text-[#58a6ff] border border-blue-800/40">
                              {task.status}
                            </span>
                          </div>

                          <div className="text-[10px] text-[#8b949e] flex items-center space-x-1 font-mono">
                            <Users className="w-3 h-3 text-[#58a6ff]" />
                            <span className="text-white">{task.agentId}</span>
                            <span>•</span>
                            <span className="text-[#f472b6]">
                              {task.agentId.includes("lead") || task.agentId.includes("pm")
                                ? "Frontier Reasoning"
                                : "90% Fast Tier"}
                            </span>
                          </div>

                          {task.streamOutput && (
                            <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] text-[11px] font-mono text-[#c9d1d9] leading-relaxed">
                              {task.streamOutput}
                            </div>
                          )}

                          {task.status === "completed" && (
                            <div className="text-[10px] text-[#58a6ff] flex items-center space-x-1 pt-1 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Blackboard artifact published</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
