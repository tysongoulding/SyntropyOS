import React, { useState } from "react";
import { MessageItem as MessageItemType } from "../../store/sessionStore";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolActionCard } from "../cards/ToolActionCard";
import { CodeBlock } from "./CodeBlock";
import { MermaidViewer } from "../diagrams/MermaidViewer";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Copy,
  Check,
  Info,
  Lightbulb,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { useToastStore } from "../../store/toastStore";

interface MessageItemProps {
  message: MessageItemType;
}

// GitHub Callout / Alert parser
function renderAlertCallout(text: string) {
  const noteMatch = text.match(/^\[!NOTE\]\s*([\s\S]*)/i);
  if (noteMatch) {
    return {
      type: "note",
      title: "Note",
      icon: Info,
      color: "border-blue-500 bg-blue-950/25 text-blue-200",
      iconColor: "text-blue-400",
      body: noteMatch[1],
    };
  }

  const tipMatch = text.match(/^\[!TIP\]\s*([\s\S]*)/i);
  if (tipMatch) {
    return {
      type: "tip",
      title: "Tip",
      icon: Lightbulb,
      color: "border-emerald-500 bg-emerald-950/25 text-emerald-200",
      iconColor: "text-emerald-400",
      body: tipMatch[1],
    };
  }

  const impMatch = text.match(/^\[!IMPORTANT\]\s*([\s\S]*)/i);
  if (impMatch) {
    return {
      type: "important",
      title: "Important",
      icon: Flame,
      color: "border-purple-500 bg-purple-950/25 text-purple-200",
      iconColor: "text-purple-400",
      body: impMatch[1],
    };
  }

  const warnMatch = text.match(/^\[!WARNING\]\s*([\s\S]*)/i);
  if (warnMatch) {
    return {
      type: "warning",
      title: "Warning",
      icon: AlertTriangle,
      color: "border-amber-500 bg-amber-950/25 text-amber-200",
      iconColor: "text-amber-400",
      body: warnMatch[1],
    };
  }

  const cautionMatch = text.match(/^\[!CAUTION\]\s*([\s\S]*)/i);
  if (cautionMatch) {
    return {
      type: "caution",
      title: "Caution",
      icon: ShieldAlert,
      color: "border-red-500 bg-red-950/25 text-red-200",
      iconColor: "text-red-400",
      body: cautionMatch[1],
    };
  }

  return null;
}

export const MessageItem = React.memo(function MessageItem({ message }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToastStore();

  const handleCopy = async () => {
    try {
      const textToCopy = message.content || message.reasoning || "";
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      addToast("Copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast("Failed to copy text", "error");
    }
  };

  // User prompt: Single bubble with no user or icon
  if (message.role === "user") {
    return (
      <div className="flex justify-end my-3 group">
        <div className="relative bg-[#21262d] border border-[#30363d]/80 text-[#f0f6fc] px-4 py-2.5 rounded-2xl max-w-[80%] text-xs md:text-sm whitespace-pre-wrap leading-relaxed shadow-xs select-text">
          {message.content}
          <button
            type="button"
            onClick={handleCopy}
            className="absolute -left-7 top-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white transition"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // Tool call cards
  if (message.role === "tool" && message.toolCall) {
    return (
      <div className="my-2 max-w-full">
        <ToolActionCard toolCall={message.toolCall} />
      </div>
    );
  }

  // System alerts
  if (message.role === "system") {
    return (
      <div className="my-2 p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs font-mono select-text">
        {message.content}
      </div>
    );
  }

  const isGenerating = !message.content && !!message.reasoning;

  // AI response: Responds directly to the flat back of the screen
  return (
    <div className="flex flex-col justify-start my-4 w-full max-w-full min-w-0 group select-text">
      {message.reasoning && <ThinkingBlock reasoning={message.reasoning} />}

      {message.content ? (
        <div className="markdown-content text-[#c9d1d9] text-xs md:text-sm leading-relaxed w-full max-w-full min-w-0 break-words">
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1({ children }) {
                return (
                  <h1 className="text-lg font-bold text-white border-b border-[#30363d] pb-1.5 mt-5 mb-2.5 flex items-center space-x-2">
                    <span>{children}</span>
                  </h1>
                );
              },
              h2({ children }) {
                return (
                  <h2 className="text-base font-semibold text-white border-b border-[#30363d]/60 pb-1 mt-4 mb-2">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return <h3 className="text-sm font-semibold text-[#58a6ff] mt-3.5 mb-1.5">{children}</h3>;
              },
              h4({ children }) {
                return <h4 className="text-xs font-semibold text-purple-300 mt-2.5 mb-1 uppercase tracking-wider">{children}</h4>;
              },
              blockquote({ children }) {
                const extractText = (node: React.ReactNode): string => {
                  if (typeof node === "string" || typeof node === "number") return String(node);
                  if (Array.isArray(node)) return node.map(extractText).join("");
                  if (React.isValidElement(node) && node.props && typeof node.props === "object") {
                    const props = node.props as { children?: React.ReactNode };
                    return extractText(props.children);
                  }
                  return "";
                };

                const rawText = extractText(children);
                const alert = renderAlertCallout(rawText);
                if (alert) {
                  const Icon = alert.icon;
                  return (
                    <div className={`my-3 p-3 rounded-xl border-l-4 ${alert.color} shadow-xs space-y-1 select-text`}>
                      <div className="flex items-center space-x-2 font-semibold text-xs uppercase tracking-wide">
                        <Icon className={`w-3.5 h-3.5 ${alert.iconColor}`} />
                        <span>{alert.title}</span>
                      </div>
                      <div className="text-xs pl-5 text-[#c9d1d9] leading-relaxed">{alert.body}</div>
                    </div>
                  );
                }

                return (
                  <blockquote className="border-l-2 border-[#58a6ff]/70 bg-[#161b22]/40 pl-3 py-1.5 rounded-r my-2.5 text-[#8b949e] italic text-xs">
                    {children}
                  </blockquote>
                );
              },
              table({ children }) {
                return (
                  <div className="my-3 overflow-x-auto rounded-lg border border-[#30363d] bg-[#0d1117] select-text">
                    <table className="w-full text-left border-collapse text-xs">{children}</table>
                  </div>
                );
              },
              thead({ children }) {
                return <thead className="bg-[#161b22] text-white border-b border-[#30363d]">{children}</thead>;
              },
              tbody({ children }) {
                return <tbody className="divide-y divide-[#30363d]/50 bg-[#0d1117]">{children}</tbody>;
              },
              th({ children }) {
                return <th className="p-2.5 font-semibold text-[#8b949e] uppercase text-[10px] tracking-wider">{children}</th>;
              },
              td({ children }) {
                return <td className="p-2.5 text-[#c9d1d9]">{children}</td>;
              },
              tr({ children }) {
                return <tr className="hover:bg-[#161b22]/30 transition-colors">{children}</tr>;
              },
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#58a6ff] hover:text-[#79c0ff] underline inline-flex items-center space-x-0.5"
                  >
                    <span>{children}</span>
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                  </a>
                );
              },
              ul({ children }) {
                return <ul className="list-disc pl-5 my-2 space-y-1 text-[#c9d1d9]">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal pl-5 my-2 space-y-1 text-[#c9d1d9]">{children}</ol>;
              },
              li({ children }) {
                return <li className="leading-relaxed">{children}</li>;
              },
              input({ type, checked, disabled }) {
                if (type === "checkbox") {
                  return (
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      readOnly
                      className="rounded border-[#30363d] bg-[#161b22] text-[#58a6ff] focus:ring-0 mr-2 align-middle cursor-default"
                    />
                  );
                }
                return <input type={type} />;
              },
              hr() {
                return <hr className="my-4 border-[#30363d]" />;
              },
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className || "");
                const lang = match ? match[1].toLowerCase() : "text";
                const isInline = !match && !String(children).includes("\n");
                const codeString = String(children).replace(/\n$/, "");

                if (!isInline && lang === "mermaid") {
                  return (
                    <div className="my-3 w-full max-w-full min-w-0 overflow-hidden">
                      <MermaidViewer code={codeString} />
                    </div>
                  );
                }

                return (
                  <CodeBlock
                    inline={isInline}
                    language={lang}
                    code={codeString}
                  />
                );
              },
            }}
          >
            {message.content}
          </Markdown>
        </div>
      ) : isGenerating ? (
        <div className="flex items-center space-x-2 text-[#8b949e] py-2 text-xs font-mono animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-ping" />
          <span>Synthesizing response...</span>
        </div>
      ) : null}

      {/* Subtle action bar below response */}
      {message.content && (
        <div className="flex items-center space-x-2 mt-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity select-none">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22] border border-transparent hover:border-[#30363d] transition"
            title="Copy response"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

