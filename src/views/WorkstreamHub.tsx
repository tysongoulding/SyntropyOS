import React, { useState } from "react";
import { Zap, Play, Layers, ShieldCheck, ArrowRight } from "lucide-react";
import { useWorkstreamStore } from "@/stores/useWorkstreamStore";
import { invoke } from "@tauri-apps/api/core";

export const WorkstreamHub: React.FC = () => {
  const { workstreams, setActiveWorkstream, addWorkstream } = useWorkstreamStore();
  const [launching, setLaunching] = useState(false);

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
          streamOutput: "Ingesting directive specifications... Mapping user flows.",
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
          content: "# User Journey Map\nSynthesized by autonomous SME federation.",
          mime_type: "text/markdown",
          version: 1,
          hash: "e829c...11a",
          created_at: new Date().toISOString(),
        },
      ],
    });

    setLaunching(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          Workstream Blueprint Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Deploy pre-configured 4-tier autonomous agent federations with zero code.
        </p>
      </div>

      {/* Featured Blueprint Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" /> Flagship Blueprint
              </span>
              <span className="text-xs text-slate-400">Fixed 60-Minute SLA</span>
            </div>

            <h3 className="text-lg font-bold text-slate-100">
              1-Hour Autonomous Agentic Sprint
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dispatches a structured 4-tier federation (Federation &gt; Workstream &gt; Team &gt; SME). SMEs execute blind parallel discovery across 4 rigid phases to deliver an actionable TeamPlan with Zero Groupthink.
            </p>

            <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] text-slate-400">
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <strong className="text-slate-200 block">Phase 1 (00-15m)</strong>
                Understand & Map
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <strong className="text-slate-200 block">Phase 2 (15-30m)</strong>
                Sketch & Ideate
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <strong className="text-slate-200 block">Phase 3 (30-45m)</strong>
                Decide & Storyboard
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <strong className="text-slate-200 block">Phase 4 (45-60m)</strong>
                Prototype & Synthesize
              </div>
            </div>
          </div>

          <button
            onClick={handleLaunchSprint}
            disabled={launching}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950 disabled:opacity-50 shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            {launching ? "Deploying..." : "Launch 1-Hour Sprint"}
          </button>
        </div>
      </div>

      {/* Active Workstreams List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Active Workstream Deployments
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workstreams.map((ws) => (
            <div
              key={ws.id}
              onClick={() => setActiveWorkstream(ws.id)}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {ws.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono">
                  {ws.status}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>{ws.currentPhase}</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 group-hover:text-slate-300">
                  {ws.tasks.length} SMEs Assigned <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
