import { useState } from "react";
import { ArtifactItem, useArtifactStore } from "../../store/artifactStore";
import { ArtifactPreviewModal } from "../artifacts/ArtifactPreviewModal";
import { ArtifactReviseModal } from "../artifacts/ArtifactReviseModal";
import {
  Layers,
  Search,
  Plus,
  Globe,
  FileText,
  FileCode,
  Database,
  Image as ImageIcon,
  Trash2,
  Code2,
  Eye,
  Sparkles,
  Calendar,
  Presentation,
} from "lucide-react";
import { useToastStore } from "../../store/toastStore";

export function ArtifactsView() {
  const { artifacts, addArtifact, deleteArtifact } = useArtifactStore();
  const { addToast } = useToastStore();

  const [search, setSearch] = useState("");
  const [selectedExt, setSelectedExt] = useState<string>("all");
  const [modalArtifact, setModalArtifact] = useState<ArtifactItem | null>(null);
  const [modalMode, setModalMode] = useState<"preview" | "code" | "split">("preview");
  const [reviseArtifact, setReviseArtifact] = useState<ArtifactItem | null>(null);

  const filterCategories = [
    { id: "all", label: "All Deliverables" },
    { id: "diagrams", label: "Diagrams (Mermaid / Draw.io)" },
    { id: "slides", label: "Slide Decks" },
    { id: "html", label: "HTML Sandboxes" },
    { id: "md", label: "MarkView (.md)" },
    { id: "svg", label: "SVG Vectors" },
    { id: "sql", label: "SQL Migrations" },
  ];

  const filtered = artifacts.filter((art) => {
    const matchesSearch =
      art.name.toLowerCase().includes(search.toLowerCase()) ||
      art.summary.toLowerCase().includes(search.toLowerCase());

    const ext = art.extension.toLowerCase();
    let matchesExt = selectedExt === "all";
    if (selectedExt === "diagrams") {
      matchesExt = ext === "mmd" || ext === "mermaid" || ext === "drawio";
    } else if (selectedExt === "slides") {
      matchesExt = ext === "deck" || ext === "slides";
    } else if (selectedExt !== "all") {
      matchesExt = ext === selectedExt;
    }

    return matchesSearch && matchesExt;
  });

  const handleOpenModal = (art: ArtifactItem, mode: "preview" | "code" | "split") => {
    setModalArtifact(art);
    setModalMode(mode);
  };

  const handleCreateNew = () => {
    const name = `flowchart_diagram_${Date.now().toString().slice(-4)}.mmd`;
    const defaultMermaid = `graph TD
    A[Client Request] --> B{Valid Payload?}
    B -->|Yes| C[Tokio FSM Dispatch]
    B -->|No| D[Reject with Error]
    C --> E[Execute Red-Green TDD]
    E --> F[Verified Delivery]`;

    addArtifact({
      name,
      extension: "mmd",
      language: "mermaid",
      summary: "Newly generated interactive Mermaid flowchart diagram.",
      userFacing: true,
      content: defaultMermaid,
    });
    addToast(`Created new Mermaid diagram: ${name}`, "success");
  };

  const getExtensionBadge = (ext: string) => {
    switch (ext.toLowerCase()) {
      case "html":
        return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "md":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "mmd":
      case "mermaid":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "drawio":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "deck":
      case "slides":
        return "text-pink-400 bg-pink-500/10 border-pink-500/30";
      case "svg":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "json":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "sql":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const renderFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case "html":
        return <Globe className="w-5 h-5 text-orange-400" />;
      case "md":
        return <FileText className="w-5 h-5 text-blue-400" />;
      case "mmd":
      case "mermaid":
        return <Layers className="w-5 h-5 text-purple-400" />;
      case "drawio":
        return <Layers className="w-5 h-5 text-amber-400" />;
      case "deck":
      case "slides":
        return <Presentation className="w-5 h-5 text-pink-400" />;
      case "svg":
        return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case "sql":
        return <Database className="w-5 h-5 text-emerald-400" />;
      default:
        return <FileCode className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] min-w-0 overflow-hidden text-xs">
      {/* Top Header & Search Controls */}
      <div className="border-b border-[#30363d] bg-[#161b22] px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0 select-none">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Artifacts & Project Deliverables</h1>
            <p className="text-[11px] text-[#8b949e]">
              Explore Mermaid diagrams, Draw.io architectures, slide presentations, HTML sandboxes, and MarkView docs.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deliverables & diagrams..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-8 pr-3 py-1.5 text-white text-xs outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* New Artifact Button */}
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow transition flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Categories Filter Bar */}
      <div className="px-6 py-2 border-b border-[#30363d] bg-[#0d1117]/80 flex items-center space-x-2 overflow-x-auto flex-shrink-0">
        <span className="text-[10px] text-[#8b949e] uppercase font-semibold mr-1">Category:</span>
        {filterCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedExt(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition whitespace-nowrap ${
              selectedExt === cat.id
                ? "bg-cyan-950/60 border border-cyan-500 text-cyan-200 font-semibold"
                : "bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
        <span className="text-[11px] text-[#8b949e] ml-auto font-mono flex-shrink-0">
          Showing {filtered.length} of {artifacts.length}
        </span>
      </div>

      {/* Grid of Artifact Cards */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-[#8b949e]">
            <Layers className="w-8 h-8 stroke-1 text-gray-500" />
            <p className="text-xs">No deliverables matching selected filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((art) => {
              const lineCount = art.content.split("\n").length;
              const verCount = art.versions?.length || 1;

              return (
                <div
                  key={art.id}
                  className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between hover:border-[#58a6ff]/60 transition shadow-sm space-y-3 group"
                >
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5 truncate mr-2">
                        <div className="p-2 rounded-xl bg-[#0d1117] border border-[#30363d] flex-shrink-0">
                          {renderFileIcon(art.extension)}
                        </div>
                        <div className="truncate">
                          <div className="font-mono text-xs font-semibold text-white truncate group-hover:text-[#58a6ff] transition">
                            {art.name}
                          </div>
                          <div className="text-[10px] text-[#8b949e] flex items-center space-x-1.5 mt-0.5 font-sans">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(art.updatedAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span>•</span>
                            <span className="font-mono">{lineCount} lines</span>
                            <span>•</span>
                            <span className="font-mono text-purple-400">v{verCount}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border uppercase flex-shrink-0 ${getExtensionBadge(
                          art.extension
                        )}`}
                      >
                        .{art.extension}
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-[11px] text-[#8b949e] line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  {/* Code Snippet Preview Box */}
                  <div className="p-2.5 bg-[#0d1117] rounded-xl border border-[#30363d] font-mono text-[10px] text-[#8b949e] line-clamp-3 overflow-hidden select-none whitespace-pre-wrap leading-tight">
                    {art.content.slice(0, 160)}...
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#30363d]/50">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {/* Live View Button */}
                      <button
                        onClick={() => handleOpenModal(art, "preview")}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white font-medium text-[11px] border border-[#30363d] transition"
                        title="Open interactive preview"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View</span>
                      </button>

                      {/* Code Editor Button */}
                      <button
                        onClick={() => handleOpenModal(art, "code")}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white font-medium text-[11px] border border-[#30363d] transition"
                        title="View code and edit"
                      >
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Edit</span>
                      </button>

                      {/* AI Revise Button with Version Control */}
                      <button
                        onClick={() => setReviseArtifact(art)}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-medium text-[11px] border border-purple-500/30 transition shadow-xs"
                        title="AI Revise artifact with git version tracking"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Revise</span>
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        deleteArtifact(art.id);
                        addToast(`Deleted ${art.name}`, "info");
                      }}
                      className="p-1.5 rounded-lg text-[#8b949e] hover:text-red-400 hover:bg-[#21262d] transition"
                      title="Delete artifact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 80% Screen Preview & Editor Modal */}
      {modalArtifact && (
        <ArtifactPreviewModal
          artifact={modalArtifact}
          initialMode={modalMode}
          onClose={() => setModalArtifact(null)}
          onOpenRevise={() => {
            const target = modalArtifact;
            setModalArtifact(null);
            setReviseArtifact(target);
          }}
        />
      )}

      {/* AI Revise & Version Control Modal */}
      {reviseArtifact && (
        <ArtifactReviseModal
          artifact={reviseArtifact}
          onClose={() => setReviseArtifact(null)}
        />
      )}
    </div>
  );
}
