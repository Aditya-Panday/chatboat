"use client";

import { ChatInput } from "@/components/ChatInput";
import { Shield, X } from "lucide-react";

type GuestIdentityFormProps = {
  name: string;
  email: string;
  error: string | null;
  disabled?: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onCloseRequest: () => void;
};

export function GuestIdentityForm({
  name,
  email,
  error,
  disabled,
  onNameChange,
  onEmailChange,
  onSubmit,
  onCloseRequest,
}: GuestIdentityFormProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="relative overflow-hidden bg-[var(--covers-blue)] px-5 pb-8 pt-6 text-white">
        <button
          type="button"
          onClick={onCloseRequest}
          aria-label="Close chat"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--covers-blue)]">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">Covers&All</p>
            <p className="text-xs text-white/80">24/7 custom cover support</p>
          </div>
        </div>
        <h2 className="relative mt-5 text-[22px] font-semibold leading-7">
          Hi! Please share your name and email to get started.
        </h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5">
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-blue-100"
            placeholder="Your name"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-blue-100"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={onSubmit}
          className="mt-auto rounded-lg bg-[var(--covers-blue)] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Start Chat
        </button>
      </div>
    </div>
  );
}
