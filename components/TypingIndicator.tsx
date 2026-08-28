"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2" aria-live="polite" aria-label="Assistant is typing">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--covers-blue)] text-white">
        <span className="sr-only">Covers&All assistant</span>
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-3">
        <span className="covers-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span className="covers-dot h-1.5 w-1.5 rounded-full bg-slate-400 [animation-delay:160ms]" />
        <span className="covers-dot h-1.5 w-1.5 rounded-full bg-slate-400 [animation-delay:320ms]" />
      </div>
    </div>
  );
}
