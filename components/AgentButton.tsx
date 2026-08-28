"use client";

import { Headset } from "lucide-react";
import type { HandoffStatus } from "@/lib/types";

type AgentHandoffButtonProps = {
  status: HandoffStatus;
  onRequestAgent: () => void;
};

export function AgentHandoffButton({
  status,
  onRequestAgent,
}: AgentHandoffButtonProps) {
  if (status === "requested") {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] leading-5 text-emerald-900"
      >
        <p className="font-semibold">Agent requested</p>
        <p className="mt-0.5">
          A Covers&All specialist will join this chat. You can keep talking with
          the assistant in the meantime.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onRequestAgent}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--covers-blue)] bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--covers-blue)] transition hover:bg-[var(--covers-blue-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--covers-blue)]"
    >
      <Headset className="h-3.5 w-3.5" />
      Chat with Agent
    </button>
  );
}
