import { useState } from "react";
import { ToolCallData } from "../../store/sessionStore";
import { Wrench, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

interface ToolCallBlockProps {
  toolCall: ToolCallData;
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full bg-[#161b22] border border-[#30363d] rounded-lg my-2 font-mono text-xs overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#1c2128] hover:bg-[#21262d] transition select-none"
      >
        <div className="flex items-center space-x-2">
          <Wrench className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span className="font-semibold text-white">{toolCall.tool}</span>
          {toolCall.durationMs !== undefined && (
            <span className="text-[#8b949e] text-[10px]">
              ({toolCall.durationMs}ms)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {toolCall.output !== undefined ? (
            toolCall.isError ? (
              <span className="flex items-center space-x-1 text-red-400 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Failed</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-green-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done</span>
              </span>
            )
          ) : (
            <span className="text-yellow-400 text-[11px] animate-pulse">Running...</span>
          )}
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#8b949e]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#8b949e]" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 space-y-2 border-t border-[#30363d]">
          <div>
            <div className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1">
              Arguments
            </div>
            <pre className="bg-[#0d1117] p-2 rounded text-[#c9d1d9] overflow-x-auto text-[11px]">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>

          {toolCall.output && (
            <div>
              <div className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1">
                Output
              </div>
              <pre
                className={`p-2 rounded text-[11px] max-h-60 overflow-y-auto whitespace-pre-wrap ${
                  toolCall.isError
                    ? "bg-red-950/20 text-red-400 border border-red-900/40"
                    : "bg-[#0d1117] text-[#7ee787]"
                }`}
              >
                {toolCall.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
