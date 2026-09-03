import { useSessionStore } from "../../store/sessionStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { Cpu, AlertTriangle, ShieldCheck } from "lucide-react";

export function ContextGauge() {
  const { usage } = useSessionStore();
  const { maxContextTokens } = useWorkspaceStore();

  const inTokens = usage.inputTokens || 0;
  const outTokens = usage.outputTokens || 0;
  const total = inTokens + outTokens;
  const percent = usage.contextPercent !== undefined ? usage.contextPercent : (total / maxContextTokens) * 100;

  const isHigh = percent > 75;
  const isCritical = percent > 90;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3 text-xs text-[#c9d1d9]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[#58a6ff]" />
          <span className="font-semibold text-white">Context Window Usage</span>
        </div>

        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
          {isCritical ? (
            <span className="flex items-center space-x-1 text-red-400 font-semibold bg-red-950/30 px-1.5 py-0.5 rounded border border-red-900/40">
              <AlertTriangle className="w-3 h-3" />
              <span>Compact Soon</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-green-400 font-semibold bg-green-950/30 px-1.5 py-0.5 rounded border border-green-800/40">
              <ShieldCheck className="w-3 h-3" />
              <span>Healthy</span>
            </span>
          )}
          <span className="text-white font-bold">{percent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden border border-[#30363d]">
        <div
          className={`h-full transition-all duration-300 ${
            isCritical ? "bg-red-500" : isHigh ? "bg-amber-400" : "bg-blue-500"
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Token Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px] text-center">
        <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
          <div className="text-[#8b949e] mb-0.5">Input Tokens</div>
          <div className="font-semibold text-white">{inTokens.toLocaleString()}</div>
        </div>

        <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
          <div className="text-[#8b949e] mb-0.5">Output Tokens</div>
          <div className="font-semibold text-white">{outTokens.toLocaleString()}</div>
        </div>

        <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
          <div className="text-[#8b949e] mb-0.5">Budget Limit</div>
          <div className="font-semibold text-white">{maxContextTokens.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
