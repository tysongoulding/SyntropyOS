import { useState } from "react";
import { MessageItem as MessageItemType } from "../../store/sessionStore";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolActionCard } from "../cards/ToolActionCard";
import { CodeBlock } from "./CodeBlock";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Copy, Check, Bot, User } from "lucide-react";
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

  if (message.role === "user") {
    return (
      <div className="flex justify-end my-1 group">
        <div className="relative bg-[#1f6feb] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-xs md:text-sm whitespace-pre-wrap leading-relaxed shadow-sm select-text cursor-text">
          <div className="flex items-center justify-between space-x-3 mb-1">
            <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>You</span>
            </span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-700 text-blue-200 hover:text-white transition"
              title="Copy message"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "tool" && message.toolCall) {
    return <ToolActionCard toolCall={message.toolCall} />;
  }

  if (message.role === "system") {
    return (
      <div className="my-2 p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs font-mono select-text">
        {message.content}
      </div>
    );
  }

  const isGenerating = !message.content && !!message.reasoning;

  return (
    <div className="flex justify-start my-1 w-full group">
      <div className="w-full bg-[#161b22] border border-[#30363d] rounded-2xl rounded-tl-sm p-4 text-xs md:text-sm text-[#c9d1d9] shadow-sm select-text cursor-text">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d]/60 select-none">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-blue-400">
            <Bot className="w-3.5 h-3.5" />
            <span>Rho Assistant</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition text-[10px]"
            title="Copy response to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {message.reasoning && <ThinkingBlock reasoning={message.reasoning} />}

        {message.content ? (
          <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed select-text">
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
          <div className="flex items-center space-x-2 text-[#8b949e] py-1 text-xs font-mono animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Synthesizing response...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
