"use client";

import type { ChatMessage, ConversationCustomer } from "@/lib/admin/chats-data";
import {
  ArrowRight,
  CheckCheck,
  FileImage,
  Paperclip,
  Send,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type ChatMessageFeedProps = {
  messages: ChatMessage[];
  customer: ConversationCustomer;
};

export function ChatMessageFeed({ messages, customer }: ChatMessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6f9] px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((message) => {
          switch (message.type) {
            case "date":
              return (
                <div key={message.id} className="flex justify-center py-1">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200/80">
                    {message.label}
                  </span>
                </div>
              );

            case "system":
              return (
                <div
                  key={message.id}
                  className="flex items-center justify-center gap-1.5 py-1 text-xs text-slate-400"
                >
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                  {message.content}
                </div>
              );

            case "ai":
              return (
                <div key={message.id} className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[72%]">
                    <div className="rounded-2xl rounded-bl-md bg-indigo-50 px-3.5 py-2.5 text-[14px] leading-5 text-slate-800 ring-1 ring-indigo-100">
                      {message.content}
                    </div>
                    <p className="mt-1 pl-1 text-[11px] text-slate-400">
                      {message.time}
                    </p>
                  </div>
                </div>
              );

            case "customer":
              return (
                <div key={message.id} className="flex items-end gap-2">
                  <CustomerAvatar customer={customer} />
                  <div className="max-w-[85%] sm:max-w-[72%]">
                    <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] leading-5 text-slate-800 shadow-sm">
                      {message.content}
                    </div>
                    <p className="mt-1 pl-1 text-[11px] text-slate-400">
                      {message.time}
                    </p>
                  </div>
                </div>
              );

            case "attachment":
              return (
                <div key={message.id} className="flex items-end gap-2">
                  {message.from === "customer" ? (
                    <CustomerAvatar customer={customer} />
                  ) : (
                    <span className="w-8 shrink-0" />
                  )}
                  <div className="max-w-[85%] sm:max-w-[72%]">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <FileImage className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {message.fileName}
                        </p>
                        <p className="text-xs text-slate-400">{message.fileSize}</p>
                      </div>
                    </div>
                    <p className="mt-1 pl-1 text-[11px] text-slate-400">
                      {message.time}
                    </p>
                  </div>
                </div>
              );

            case "agent":
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[72%]">
                    <div className="rounded-2xl rounded-br-md bg-[var(--covers-blue)] px-3.5 py-2.5 text-[14px] leading-5 text-white">
                      {message.content}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 pr-1">
                      <span className="text-[11px] text-slate-400">
                        {message.time}
                      </span>
                      {message.seen ? (
                        <CheckCheck
                          className="h-3.5 w-3.5 text-[var(--covers-blue)]"
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function CustomerAvatar({ customer }: { customer: ConversationCustomer }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${customer.avatarClassName}`}
    >
      {customer.initials}
    </span>
  );
}

type ChatComposerProps = {
  customerName: string;
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function ChatComposer({
  customerName,
  onSend,
  disabled,
}: ChatComposerProps) {
  const [draft, setDraft] = useState("");

  function submitMessage() {
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setDraft("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-[var(--covers-blue)] focus-within:ring-2 focus-within:ring-[var(--covers-blue-soft)]">
          <button
            type="button"
            className="mb-0.5 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Attach file"
          >
            <Paperclip className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>

          <textarea
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={`Type your message to ${customerName.split(" ")[0]}...`}
            className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={disabled || !draft.trim()}
            aria-label="Send message"
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--covers-blue)] text-white transition hover:bg-[var(--covers-blue-dark)] disabled:opacity-40"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </form>

      <div className="mt-2 hidden items-center justify-between text-[11px] text-slate-400 sm:flex">
        <p>Press Enter to send, Shift+Enter for new line</p>
        <button
          type="button"
          className="font-medium text-[var(--covers-blue)] hover:underline"
        >
          Use Template
        </button>
      </div>
    </div>
  );
}
