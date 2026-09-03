import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageItem as MessageItemType } from "../../store/sessionStore";
import { MessageItem } from "./MessageItem";
import { Terminal } from "lucide-react";

interface VirtualizedMessageFeedProps {
  messages: MessageItemType[];
}

export function VirtualizedMessageFeed({ messages }: VirtualizedMessageFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  // Handle auto-scroll on new streaming chunks
  useEffect(() => {
    if (autoScrollRef.current && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior: "auto" });
    }
  }, [messages, virtualizer]);

  const handleScroll = () => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    autoScrollRef.current = isAtBottom;
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e] p-4 text-center select-none">
        <div className="p-4 rounded-full bg-[#161b22] border border-[#30363d] mb-4 shadow-md">
          <Terminal className="w-8 h-8 text-[#58a6ff]" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Rho Streaming Workbench</h3>
        <p className="text-xs max-w-sm text-[#8b949e] leading-relaxed">
          Ask for code generation, file edits, multi-turn architecture plans, or run terminal commands.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-3"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="pb-3"
            >
              <MessageItem message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
