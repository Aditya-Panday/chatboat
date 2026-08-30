"use client";

import type { Conversation } from "@/lib/admin/chats-data";
import { ChatComposer, ChatMessageFeed } from "@/components/admin/chats/ChatMessageFeed";
import type { ChatMessage } from "@/lib/admin/chats-data";
import { ArrowLeft, MoreVertical } from "lucide-react";

type ActiveChatPanelProps = {
  conversation: Conversation | null;
  messages: ChatMessage[];
  onBack: () => void;
  onSend: (message: string) => void;
  onResolve: () => void;
  onAssign?: () => void;
  showBackButton: boolean;
};

export function ActiveChatPanel({
  conversation,
  messages,
  onBack,
  onSend,
  onResolve,
  onAssign,
  showBackButton,
}: ActiveChatPanelProps) {
  if (!conversation) {
    return (
      <div className="hidden min-h-0 flex-1 flex-col items-center justify-center bg-[#f4f6f9] lg:flex">
        <p className="text-sm text-slate-500">Select a conversation to start chatting</p>
      </div>
    );
  }

  const { customer } = conversation;
  const isResolved = conversation.sessionStatus === "CLOSED";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {showBackButton ? (
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}

          <div className="relative shrink-0">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${customer.avatarClassName}`}
            >
              {customer.initials}
            </span>
            {customer.status === "online" ? (
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            ) : null}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {customer.name}
            </h3>
            <p className="truncate text-xs text-slate-500">
              {customer.status === "online" ? (
                <span className="text-emerald-600">{customer.source}</span>
              ) : (
                customer.source
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onAssign}
            className="h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 inline-flex"
          >
            Assign
          </button>
          <button
            type="button"
            onClick={onResolve}
            disabled={isResolved}
            className="h-9 rounded-lg bg-[var(--covers-blue)] px-3.5 text-xs font-semibold text-white transition hover:bg-[var(--covers-blue-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            {isResolved ? "Resolved" : "Resolve"}
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="More actions"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      <ChatMessageFeed messages={messages} customer={customer} />

      <div className="shrink-0">
        <ChatComposer
          customerName={customer.name}
          onSend={onSend}
          disabled={isResolved}
        />
      </div>
    </div>
  );
}
