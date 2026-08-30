"use client";

import { AgentHandoffButton } from "@/components/AgentButton";
import { isAgentHandoffVisible } from "@/lib/chat/handoff-ui";
import type { HandoffStatus } from "@/lib/types";

type AgentHandoffBarProps = {
  handoffStatus: HandoffStatus;
  isSessionClosed?: boolean;
  onRequestAgent: () => void;
};

/** Persistent agent handoff control pinned above the composer during AI-handled chats. */
export function AgentHandoffBar({
  handoffStatus,
  isSessionClosed = false,
  onRequestAgent,
}: AgentHandoffBarProps) {
  if (!isAgentHandoffVisible(handoffStatus, isSessionClosed)) {
    return null;
  }

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5">
      <div className="flex justify-center">
        <AgentHandoffButton
          status={handoffStatus}
          onRequestAgent={onRequestAgent}
        />
      </div>
    </div>
  );
}
