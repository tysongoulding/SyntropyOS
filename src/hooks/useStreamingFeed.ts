import { useEffect, useRef, useCallback } from "react";
import { useSessionStore } from "../store/sessionStore";

export function useStreamingFeed() {
  const textBufferRef = useRef("");
  const reasoningBufferRef = useRef("");
  const frameIdRef = useRef<number | null>(null);

  const appendBufferedChunk = useSessionStore((s) => s.appendBufferedChunk);
  const appendBufferedReasoning = useSessionStore((s) => s.appendBufferedReasoning);

  const flush = useCallback(() => {
    if (textBufferRef.current) {
      appendBufferedChunk(textBufferRef.current);
      textBufferRef.current = "";
    }
    if (reasoningBufferRef.current) {
      appendBufferedReasoning(reasoningBufferRef.current);
      reasoningBufferRef.current = "";
    }
    frameIdRef.current = null;
  }, [appendBufferedChunk, appendBufferedReasoning]);

  const pushTextChunk = useCallback(
    (chunk: string) => {
      textBufferRef.current += chunk;
      if (!frameIdRef.current) {
        frameIdRef.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  const pushReasoningChunk = useCallback(
    (chunk: string) => {
      reasoningBufferRef.current += chunk;
      if (!frameIdRef.current) {
        frameIdRef.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  useEffect(() => {
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []);

  return {
    pushTextChunk,
    pushReasoningChunk,
    flush,
  };
}
