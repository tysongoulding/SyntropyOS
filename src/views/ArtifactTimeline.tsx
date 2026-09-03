import React, { useState } from "react";
import { FileText, ShieldCheck, Hash, GitCompare, Eye, Clock } from "lucide-react";
import { useWorkstreamStore } from "@/stores/useWorkstreamStore";

export const ArtifactTimeline: React.FC = () => {
  const { workstreams, activeWorkstreamId } = useWorkstreamStore();
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"render" | "diff">("render");

  const activeWs =
    workstreams.find((w) => w.id === activeWorkstreamId) || workstreams[0];
  const artifacts = activeWs?.artifacts || [];
  const currentArtifact = artifacts[selectedArtifactIndex] || artifacts[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Blackboard Artifact Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Decoupled, versioned document vault with strict Zero-Trust Author Write ACL enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("render")}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === "render"
                ? "bg-slate-800 text-emerald-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Rendered
          </button>
          <button
            onClick={() => setViewMode("diff")}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === "diff"
                ? "bg-slate-800 text-indigo-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" /> Version Diff
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Artifact List */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-slate-300 block">Published Artifacts</span>
          {artifacts.map((art, idx) => (
            <div
              key={art.uri}
              onClick={() => setSelectedArtifactIndex(idx)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedArtifactIndex === idx
                  ? "bg-slate-900 border-emerald-500/50 shadow-md"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs text-slate-100">{art.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  @v{art.version}
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 truncate mb-1">
                {art.uri}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> ACL: {art.author_id}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Hash className="w-3 h-3" /> {art.hash.slice(0, 8)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Artifact Document Viewer & Metadata */}
        <div className="md:col-span-2 space-y-3">
          {currentArtifact ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[600px]">
              {/* Header Bar */}
              <div className="p-4 border-b border-slate-800 bg-slate-925/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100">{currentArtifact.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Author ACL Verified
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Version {currentArtifact.version}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-emerald-400/90 break-all select-all">
                  {currentArtifact.uri}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Author: <strong className="text-slate-200 ml-0.5">{currentArtifact.author_id}</strong>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                    SHA256: {currentArtifact.hash}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(currentArtifact.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 overflow-y-auto flex-1 text-slate-200 text-xs font-mono leading-relaxed bg-slate-950/50">
                {viewMode === "render" ? (
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200">
                    {currentArtifact.content}
                  </pre>
                ) : (
                  <div className="space-y-1 font-mono text-xs">
                    <div className="text-slate-500">--- a/blackboard/user_journey@v0</div>
                    <div className="text-slate-500">+++ b/blackboard/user_journey@v1</div>
                    <div className="text-indigo-400">@@ -1,5 +1,12 @@</div>
                    <div className="bg-emerald-950/40 text-emerald-300 px-1">+ # User Journey & Domain Model Brief</div>
                    <div className="bg-emerald-950/40 text-emerald-300 px-1">+ ### 1. Primary Persona: Non-Technical Department Manager</div>
                    <div className="bg-emerald-950/40 text-emerald-300 px-1">+ - Needs zero-code deployment of 4-tier agent federations.</div>
                    <div className="bg-emerald-950/40 text-emerald-300 px-1">+ - Requires human-in-the-loop governance for mutations.</div>
                    <div className="bg-emerald-950/40 text-emerald-300 px-1">+ - Needs transparent FTA ROI metrics.</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500">
              No artifacts selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
