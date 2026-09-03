import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, AlertCircle } from "lucide-react";
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
  const { addToast } = useToastStore();

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
        const id = `mermaid-svg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code.trim());
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
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("Copied Mermaid definition to clipboard", "info");
    } catch {
      addToast("Failed to copy code", "error");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden select-none">
      {/* Diagram Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white font-mono text-[11px] uppercase tracking-wider">
            Mermaid Diagram
          </span>
          <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            Interactive Vector
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Zoom Controls */}
          <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5 space-x-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-white">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d] transition flex items-center space-x-1"
            title="Copy Mermaid Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[300px] bg-[#0d1117]"
      >
        {error ? (
          <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-red-300 max-w-lg space-y-2 text-xs">
            <div className="flex items-center space-x-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Mermaid Render Error</span>
            </div>
            <pre className="text-[11px] font-mono whitespace-pre-wrap text-red-200/80 bg-[#0d1117] p-3 rounded-lg border border-red-900/50">
              {error}
            </pre>
          </div>
        ) : svgContent ? (
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.15s ease-out" }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto"
          />
        ) : (
          <div className="text-[#8b949e] text-xs font-mono animate-pulse">Rendering diagram...</div>
        )}
      </div>
    </div>
  );
}
