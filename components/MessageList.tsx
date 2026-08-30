"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import type { ChatMessage, HandoffStatus } from "@/lib/types";

type MessageListProps = {
  messages: ChatMessage[];
  isSending: boolean;
  handoffStatus: HandoffStatus;
};

export function MessageList({
  messages,
  isSending,
  handoffStatus,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isSending, handoffStatus]);

  if (messages.length === 0 && !isSending) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
        Send a message to start chatting with Covers&All support.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="flex flex-col gap-3 px-3 py-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            senderType={message.senderType}
          />
        ))}
        {isSending ? <TypingIndicator /> : null}
      </div>
    </div>
  );
}
