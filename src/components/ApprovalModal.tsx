import React from "react";
import { ShieldAlert, Check, X, AlertTriangle } from "lucide-react";
import { useWorkstreamStore } from "@/stores/useWorkstreamStore";

export const ApprovalModal: React.FC = () => {
  const { pendingApproval, setPendingApproval } = useWorkstreamStore();

  if (!pendingApproval) return null;

  const handleApprove = () => {
    // Dispatch approval to backend / resolve
    setPendingApproval(null);
  };

  const handleReject = () => {
    // Dispatch rejection
    setPendingApproval(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Human-in-the-Loop Approval Required
              </h3>
              <p className="text-xs text-amber-400/90 font-medium">
                External Mutation Intercepted
              </p>
            </div>
          </div>
          <button
            onClick={handleReject}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Agent <strong className="text-slate-100 font-mono">{pendingApproval.agent_id}</strong> is requesting to execute external tool:
              <strong className="text-emerald-400 font-mono ml-1">{pendingApproval.tool_name}</strong>
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block mb-1">Rationale:</span>
            <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 font-mono">
              {pendingApproval.rationale}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium block mb-1">Parameters:</span>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 font-mono overflow-x-auto text-[11px] max-h-36">
              {JSON.stringify(pendingApproval.parameters, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-slate-925 border-t border-slate-800 px-5 py-3.5 flex items-center justify-end gap-2.5">
          <button
            onClick={handleReject}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            Reject Action
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Authorize & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
