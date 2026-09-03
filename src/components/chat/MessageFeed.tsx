import { useRef, useEffect } from "react";
import { MessageItem as MessageItemType } from "../../store/sessionStore";
import { MessageItem } from "./MessageItem";
import { Terminal } from "lucide-react";

interface MessageFeedProps {
  messages: MessageItemType[];
}

export function MessageFeed({ messages }: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e] p-4 text-center select-none">
        <div className="p-4 rounded-full bg-[#161b22] border border-[#30363d] mb-4">
          <Terminal className="w-8 h-8 text-[#58a6ff]" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Rho Agent Session</h3>
        <p className="text-xs max-w-sm text-[#8b949e]">
          Send an instruction, prompt, or ask for code refactoring and analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
