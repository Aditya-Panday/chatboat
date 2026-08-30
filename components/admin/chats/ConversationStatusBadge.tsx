"use client";

import type { SessionStatus } from "@/lib/admin/chats-data";

const STATUS_STYLES: Record<string, string> = {
  AI: "bg-violet-50 text-violet-700 ring-violet-100",
  Waiting: "bg-amber-50 text-amber-700 ring-amber-100",
  Assigned: "bg-blue-50 text-blue-700 ring-blue-100",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

type ConversationStatusBadgeProps = {
  statusLabel: string;
  sessionStatus: SessionStatus;
};

export function ConversationStatusBadge({
  statusLabel,
  sessionStatus,
}: ConversationStatusBadgeProps) {
  const styleKey =
    sessionStatus === "CLOSED"
      ? "Closed"
      : sessionStatus === "ACTIVE"
        ? "Active"
        : statusLabel;

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS_STYLES[styleKey] ?? STATUS_STYLES.Closed}`}
    >
      {statusLabel}
    </span>
  );
}
