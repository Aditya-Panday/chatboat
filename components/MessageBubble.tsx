"use client";

import { Bot } from "lucide-react";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
};

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
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
  );
}
