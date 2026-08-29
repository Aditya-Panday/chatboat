import type { WebsiteContext } from "@/lib/types";
import { requestWidgetHandoff } from "@/lib/chat/widget-api";

type HandoffPayload = {
  sessionId?: string;
  visitorId?: string;
  context?: WebsiteContext;
  contextSummary?: string;
  transcript?: unknown[];
};

export async function requestAgentHandoff(payload: HandoffPayload) {
  if (!payload.sessionId) {
    return { status: "requested" as const, requestedAt: new Date().toISOString() };
  }

  await requestWidgetHandoff();
  return { status: "requested" as const, requestedAt: new Date().toISOString() };
}
