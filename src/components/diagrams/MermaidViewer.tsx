import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Code2,
  Eye,
} from "lucide-react";
import { useToastStore } from "../../store/toastStore";

interface MermaidViewerProps {
  code: string;
}

export function MermaidViewer({ code }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"diagram" | "code">("diagram");
  const { addToast } = useToastStore();

  const cleanCode = code
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/```$/, "")
    .trim();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      themeVariables: {
        darkMode: true,
        background: "#0d1117",
        primaryColor: "#1f6feb",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#30363d",
        lineColor: "#58a6ff",
        secondaryColor: "#161b22",
        tertiaryColor: "#21262d",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      },
    });

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setError(null);
        if (!cleanCode) return;
        const id = `mermaid-svg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [cleanCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("Copied Mermaid definition to clipboard", "info");
    } catch {
      addToast("Failed to copy code", "error");
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden select-none my-3 shadow-xs">
      {/* Diagram Action Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5 space-x-0.5">
            <button
              type="button"
              onClick={() => setViewMode("diagram")}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                viewMode === "diagram"
                  ? "bg-[#21262d] text-white shadow-xs"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Diagram</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                viewMode === "code"
                  ? "bg-[#21262d] text-white shadow-xs"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Source</span>
            </button>
          </div>

          <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-mono hidden sm:inline-block">
            Mermaid Vector
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Zoom Controls (Diagram Mode Only) */}
          {viewMode === "diagram" && !error && svgContent && (
            <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5 space-x-0.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono px-1 text-white select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d] transition flex items-center space-x-1"
            title="Copy Mermaid Code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="overflow-auto p-4 flex items-center justify-center min-h-[160px] max-h-[560px] bg-[#0d1117]"
      >
        {viewMode === "code" ? (
          <div className="w-full">
            <pre className="text-[#c9d1d9] font-mono text-xs p-3 rounded-lg bg-[#161b22] border border-[#30363d] overflow-x-auto whitespace-pre select-text">
              {cleanCode}
            </pre>
          </div>
        ) : error ? (
          <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-xl text-amber-200 w-full space-y-2 text-xs select-text">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Diagram rendering in progress or syntax incomplete</span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className="text-[11px] text-[#58a6ff] hover:underline"
              >
                View Source Code
              </button>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap text-[#8b949e] bg-[#161b22] p-2.5 rounded-lg border border-[#30363d]">
              {cleanCode}
            </pre>
          </div>
        ) : svgContent ? (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto"
          />
        ) : (
          <div className="text-[#8b949e] text-xs font-mono animate-pulse py-6">
            Rendering vector diagram...
          </div>
        )}
      </div>
    </div>
  );
}
