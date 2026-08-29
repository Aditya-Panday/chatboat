import { Bot } from "lucide-react";

export function AdminLoginBranding() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-10 py-16 text-center text-white">
      <div
        className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full border border-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-8 bottom-8 h-48 w-48 rounded-full border border-sky-300/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/5 blur-2xl"
        aria-hidden
      />

      <div className="relative z-10 flex max-w-md flex-col items-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm">
          <Bot className="h-8 w-8" strokeWidth={2} />
        </span>

        <h2 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome to Covers&All
        </h2>

        <p className="mt-4 text-[15px] leading-7 text-blue-100/90">
          Manage live chat sessions, monitor agent performance, and configure
          your AI support widget from a single command center.
        </p>
      </div>
    </div>
  );
}
