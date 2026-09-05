import { useState } from "react";
import { MessageItem as MessageItemType } from "../../store/sessionStore";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolActionCard } from "../cards/ToolActionCard";
import { CodeBlock } from "./CodeBlock";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Copy, Check } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

interface MessageItemProps {
  message: MessageItemType;
}

export function MessageItem({ message }: MessageItemProps) {
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
    <div className="flex flex-col justify-start my-4 w-full group select-text">
      {message.reasoning && <ThinkingBlock reasoning={message.reasoning} />}

      {message.content ? (
        <div className="markdown-content text-[#c9d1d9] text-xs md:text-sm leading-relaxed max-w-none break-words">
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match && !String(children).includes("\n");
                return (
                  <CodeBlock
                    inline={isInline}
                    language={match ? match[1] : "text"}
                    code={String(children).replace(/\n$/, "")}
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
}

