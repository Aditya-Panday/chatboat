"use client";

import { ChatInput } from "@/components/ChatInput";
import { MessageList } from "@/components/MessageList";
import type { ChatMessage, HandoffStatus } from "@/lib/types";
import { AlertCircle, Shield, X } from "lucide-react";

type ChatWindowProps = {
  messages: ChatMessage[];
  draft: string;
  isSending: boolean;
  error: string | null;
  handoffStatus: HandoffStatus;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onCloseRequest: () => void;
  onRequestAgent: () => void;
  onRetry?: () => void;
};

export function ChatWindow({
  messages,
  draft,
  isSending,
  error,
  handoffStatus,
  onDraftChange,
  onSubmit,
  onCloseRequest,
  onRequestAgent,
  onRetry,
}: ChatWindowProps) {
  return (
    <div
      id="coversall-chat-panel"
      className="flex min-h-0 flex-1 flex-col bg-white"
    >
      <header className="flex items-center gap-2 bg-[var(--covers-blue)] px-3 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--covers-blue)]">
          <Shield className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">Covers&All</p>
          <p className="flex items-center gap-1.5 text-[11px] text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Online · usually replies instantly
          </p>
        </div>
        <button
          type="button"
          onClick={onCloseRequest}
          aria-label="Close chat"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
        <MessageList
          messages={messages}
          isSending={isSending}
          handoffStatus={handoffStatus}
          onRequestAgent={onRequestAgent}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 border-t border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p>{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <ChatInput
        value={draft}
        disabled={isSending}
        onChange={onDraftChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}
