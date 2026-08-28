"use client";

import { useEffect, useRef } from "react";
import { AgentHandoffButton } from "@/components/AgentButton";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import type { ChatMessage, HandoffStatus } from "@/lib/types";

type MessageListProps = {
  messages: ChatMessage[];
  isSending: boolean;
  handoffStatus: HandoffStatus;
  onRequestAgent: () => void;
};

export function MessageList({
  messages,
  isSending,
  handoffStatus,
  onRequestAgent,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, handoffStatus]);

  if (messages.length === 0 && !isSending) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
        Send a message to start chatting with Covers&All support.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-4">
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col gap-2">
          <MessageBubble role={message.role} content={message.content} />
          {message.role === "assistant" &&
          message.suggestAgent &&
          handoffStatus === "idle" ? (
            <div className="pl-9">
              <AgentHandoffButton
                status={handoffStatus}
                onRequestAgent={onRequestAgent}
              />
            </div>
          ) : null}
        </div>
      ))}
      {handoffStatus === "requested" ? (
        <div className="pl-9">
          <AgentHandoffButton
            status={handoffStatus}
            onRequestAgent={onRequestAgent}
          />
        </div>
      ) : null}
      {isSending ? <TypingIndicator /> : null}
      <div ref={endRef} />
    </div>
  );
}
