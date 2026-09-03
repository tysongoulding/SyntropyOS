import { useTurnQueue } from "../../hooks/useTurnQueue";
import { Layers, X } from "lucide-react";

export function QueueBadge() {
  const { queue, removeAt } = useTurnQueue();

  if (queue.length === 0) return null;

  return (
    <div className="px-4 py-2 border-t border-[#30363d] bg-[#161b22] flex items-center space-x-2 text-xs overflow-x-auto">
      <div className="flex items-center space-x-1 text-[#58a6ff] font-medium flex-shrink-0">
        <Layers className="w-3.5 h-3.5" />
        <span>Queue ({queue.length}):</span>
      </div>
      <div className="flex items-center space-x-2">
        {queue.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5 text-[#c9d1d9] text-[11px]"
          >
            <span className="truncate max-w-[160px]">{item}</span>
            <button
              onClick={() => removeAt(idx)}
              className="text-[#8b949e] hover:text-red-400 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
