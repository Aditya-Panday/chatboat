"use client";

import { ChatInput } from "@/components/ChatInput";
import { QuickActions, type QuickActionId } from "@/components/QuickActions";
import { Shield, X } from "lucide-react";

type WelcomeScreenProps = {
  draft: string;
  disabled?: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onQuickAction: (id: QuickActionId) => void;
  onClose: () => void;
};

export function WelcomeScreen({
  draft,
  disabled,
  onDraftChange,
  onSubmit,
  onQuickAction,
  onClose,
}: WelcomeScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="relative overflow-hidden bg-[var(--covers-blue)] px-5 pb-8 pt-6 text-white">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-10 h-24 w-24 rounded-full bg-white/10" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
          Hi, welcome to Covers&All
        </h2>
        <p className="relative mt-1.5 text-sm text-white/90">
          How can we help you today?
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Quick help
          </p>
          <QuickActions onSelect={onQuickAction} />
        </div>
        <ChatInput
          value={draft}
          disabled={disabled}
          onChange={onDraftChange}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
