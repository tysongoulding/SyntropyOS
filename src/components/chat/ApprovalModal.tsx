import { useToolApproval } from "../../hooks/useToolApproval";
import { ShieldAlert, Check, X } from "lucide-react";

export function ApprovalModal() {
  const { isWaiting, pendingApproval, approve, reject } = useToolApproval();

  if (!isWaiting || !pendingApproval) return null;

  return (
    <div className="mx-4 mb-3 p-3 bg-[#1c2128] border border-yellow-500/40 rounded-lg flex items-center justify-between text-xs shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="p-1.5 rounded-full bg-yellow-500/10 text-yellow-400">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-white">
            Permission Required
          </div>
          <div className="text-[#8b949e] mt-0.5">
            Tool <code className="bg-[#0d1117] text-[#58a6ff] px-1 py-0.5 rounded font-mono">{pendingApproval.tool}</code> requested execution.
            {pendingApproval.description && ` (${pendingApproval.description})`}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={reject}
          className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#30363d] hover:bg-[#3c444d] text-white font-medium transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>Deny</span>
        </button>
        <button
          onClick={approve}
          className="flex items-center space-x-1 px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white font-medium transition"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Approve</span>
        </button>
      </div>
    </div>
  );
}
