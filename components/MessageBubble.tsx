"use client";

import { Bot } from "lucide-react";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  senderType?: "CUSTOMER" | "AGENT" | "AI" | "SYSTEM";
};

function senderLabel(senderType?: MessageBubbleProps["senderType"]) {
  switch (senderType) {
    case "AGENT":
      return "Agent";
    case "AI":
      return "AI";
    case "SYSTEM":
      return "System";
    default:
      return "AI";
  }
}

export function MessageBubble({ role, content, senderType }: MessageBubbleProps) {
  const isUser = role === "user";
  const isSystem = senderType === "SYSTEM";

  if (isSystem) {
    return (
      <p className="text-center text-xs text-slate-500 italic">{content}</p>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      {!isUser ? (
        <span className="px-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
          {senderLabel(senderType)}
        </span>
      ) : null}
      <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser ? (
          <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--covers-blue)] text-white">
            <Bot className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <div
          className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-5 whitespace-pre-wrap ${
            isUser
              ? "rounded-br-md bg-[var(--covers-blue)] text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
