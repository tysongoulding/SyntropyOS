import React from "react";
import { Users, Bot, GitFork, CheckCircle2 } from "lucide-react";
import { useWorkstreamStore } from "@/stores/useWorkstreamStore";
import { TypewriterStream } from "@/components/TypewriterStream";

export const ExecutionBoard: React.FC = () => {
  const { workstreams, activeWorkstreamId } = useWorkstreamStore();

  const activeWs =
    workstreams.find((w) => w.id === activeWorkstreamId) || workstreams[0];

  const phases = [
    { name: "Understand & Map", id: "Phase 1: Understand & Map" },
    { name: "Sketch & Ideate", id: "Phase 2: Sketch & Ideate" },
    { name: "Decide & Storyboard", id: "Phase 3: Decide & Storyboard" },
    { name: "Prototype & Synthesize", id: "Phase 4: Prototype & Synthesize" },
  ];

  return (
    <div className="space-y-4">
      {/* 4-Tier Hierarchy Breadcrumb / Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-emerald-400" />
            4-Tier Federation Hierarchy:
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Tier 1: Global Federation
          </span>
          <span>&gt;</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Tier 2: {activeWs?.name || "Active Workstream"}
          </span>
          <span>&gt;</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Tier 3: Core Delivery Team
          </span>
          <span>&gt;</span>
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Tier 4: Assigned SMEs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Model Routing:</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            90% SME (Fast)
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            10% Lead (Reasoning)
          </span>
        </div>
      </div>

      {/* Visual Kanban 4 Phase Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {phases.map((phase) => {
          const tasksInPhase = activeWs?.tasks.filter((t) => t.phase.includes(phase.name)) || [];

          return (
            <div
              key={phase.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="font-semibold text-xs text-slate-200">
                  {phase.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {tasksInPhase.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {tasksInPhase.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-800/60 rounded-lg flex items-center justify-center text-[11px] text-slate-500 italic">
                    Awaiting phase trigger
                  </div>
                ) : (
                  tasksInPhase.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-3 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-semibold text-xs text-slate-200">
                            {task.role}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                            task.status === "running"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : task.status === "completed"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Users className="w-3 h-3" />
                        <span className="font-mono text-slate-300">{task.agentId}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-mono">
                          {task.agentId.includes("lead") || task.agentId.includes("pm")
                            ? "Reasoning Tier (10%)"
                            : "SME Fast Tier (90%)"}
                        </span>
                      </div>

                      {/* Live Typewriter Stream */}
                      <TypewriterStream
                        content={task.streamOutput}
                        isStreaming={task.status === "running"}
                      />

                      {task.status === "completed" && (
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3 h-3" /> Artifact committed to Blackboard
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
  );
};
