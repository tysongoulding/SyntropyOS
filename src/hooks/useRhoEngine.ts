import { useEffect, useCallback } from "react";
import { rhoClient } from "../lib/rpc";
import { useSessionStore } from "../store/sessionStore";
import { RpcCommand, RpcResponse } from "../lib/protocol";

export function useRhoEngine() {
  const handleEvent = useSessionStore((s) => s.handleEvent);

  useEffect(() => {
    const unsub = rhoClient.onEvent(handleEvent);
    return () => unsub();
  }, [handleEvent]);

  const send = useCallback(async (command: RpcCommand): Promise<RpcResponse> => {
    return rhoClient.sendCommand(command);
  }, []);

  const prompt = useCallback((message: string) => {
    return rhoClient.prompt(message);
  }, []);

  const steer = useCallback((message: string) => {
    return rhoClient.steer(message);
  }, []);

  const abort = useCallback(() => {
    return rhoClient.abort();
  }, []);

  const respondToTool = useCallback((approvalId: string, decision: "allow" | "deny") => {
    return rhoClient.respondToTool(approvalId, decision);
  }, []);

  return {
    send,
    prompt,
    steer,
    abort,
    respondToTool,
  };
}
