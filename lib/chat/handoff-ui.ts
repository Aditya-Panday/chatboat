import type { HandoffStatus } from "@/lib/types";

/** Agent handoff affordance is visible during AI chat and while waiting; hidden once connected. */
export function isAgentHandoffVisible(
  handoffStatus: HandoffStatus,
  isSessionClosed: boolean,
): boolean {
  return !isSessionClosed && handoffStatus !== "connected";
}
