import type { ChatMessage, WebsiteContext } from "@/lib/types";

export type HandoffRequest = {
  visitorId: string;
  reason?: string;
  context: WebsiteContext;
  transcript: ChatMessage[];
};

export type HandoffResult = {
  status: "requested";
  requestedAt: string;
};

/**
 * Phase 1: local confirmation only.
 * Later, replace the body of this function with a real backend call, e.g.
 * `return fetch("/api/handoff", { method: "POST", body: JSON.stringify(payload) })`.
 */
export async function requestAgentHandoff(
  payload: HandoffRequest,
): Promise<HandoffResult> {
  void payload;

  return {
    status: "requested",
    requestedAt: new Date().toISOString(),
  };
}
