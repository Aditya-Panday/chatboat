"use client";

import { FormEvent, KeyboardEvent, useId, useRef } from "react";
import { SendHorizontal } from "lucide-react";

type ChatInputProps = {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChatInput({
  value,
  disabled = false,
  placeholder = "Type your message...",
  onChange,
  onSubmit,
}: ChatInputProps) {
  const inputId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (disabled || !value.trim()) return;
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-slate-200 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <label htmlFor={inputId} className="sr-only">
        Message Covers&All support
      </label>
      <textarea
        id={inputId}
        ref={fieldRef}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[15px] leading-5 text-slate-900 placeholder:text-slate-400 focus:border-[var(--covers-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--covers-blue)]/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--covers-blue)] text-white transition hover:bg-[var(--covers-blue-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--covers-blue)] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <SendHorizontal className="h-[18px] w-[18px]" />
      </button>
    </form>
  );
}
