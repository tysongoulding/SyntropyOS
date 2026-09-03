import { useState } from "react";
import { useProviderStore, PreamblePreset } from "../../store/providerStore";
import { Bot, Plus, Trash2, Check, Sparkles } from "lucide-react";

export function PreambleEditor() {
  const { preambles, activePreambleId, setActivePreambleId, savePreamble, deletePreamble } = useProviderStore();
  const [editingPreset, setEditingPreset] = useState<PreamblePreset | null>(null);

  const activePreamble = preambles.find((p) => p.id === activePreambleId) || preambles[0];

  const handleCreateNew = () => {
    const newPreset: PreamblePreset = {
      id: `custom-${Date.now()}`,
      name: "Custom Preamble",
      description: "Custom tailored system prompt guidelines",
      content: "You are an autonomous engineering assistant. Write concise, correct code.",
    };
    savePreamble(newPreset);
    setEditingPreset(newPreset);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center space-x-1.5">
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span>System Preambles & Agent Guidelines</span>
        </h3>

        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white text-[11px] font-medium transition"
        >
          <Plus className="w-3 h-3" />
          <span>New Preset</span>
        </button>
      </div>

      {/* Preset List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {preambles.map((preset) => {
          const isActive = preset.id === activePreambleId;
          return (
            <div
              key={preset.id}
              onClick={() => setActivePreambleId(preset.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${
                isActive
                  ? "bg-[#161b22] border-blue-500 shadow-sm shadow-blue-500/10"
                  : "bg-[#161b22] border-[#30363d] hover:border-[#8b949e]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-xs">{preset.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <p className="text-[10px] text-[#8b949e] line-clamp-2">{preset.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#30363d]/50 mt-2 text-[10px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPreset(preset);
                  }}
                  className="text-blue-400 hover:underline"
                >
                  Edit prompt
                </button>

                {preambles.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePreamble(preset.id);
                    }}
                    className="text-[#8b949e] hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Editor Drawer / Modal */}
      {editingPreset && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <span className="font-semibold text-white text-xs flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Editing: {editingPreset.name}</span>
            </span>

            <button
              onClick={() => {
                savePreamble(editingPreset);
                setEditingPreset(null);
              }}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition"
            >
              Done Editing
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-[#8b949e] mb-0.5">Preset Name</label>
              <input
                type="text"
                value={editingPreset.name}
                onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#8b949e] mb-0.5">System Prompt Content</label>
              <textarea
                value={editingPreset.content}
                onChange={(e) => setEditingPreset({ ...editingPreset, content: e.target.value })}
                rows={4}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2.5 font-mono text-[11px] text-white focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Preamble Preview */}
      {!editingPreset && activePreamble && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-1">
          <div className="text-[10px] uppercase font-semibold text-[#8b949e]">Active System Preamble</div>
          <p className="text-[11px] text-[#c9d1d9] font-mono whitespace-pre-wrap">{activePreamble.content}</p>
        </div>
      )}
    </div>
  );
}
