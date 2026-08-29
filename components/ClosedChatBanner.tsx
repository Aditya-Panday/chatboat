"use client";

type ClosedChatBannerProps = {
  onStartNewChat: () => void;
};

export function ClosedChatBanner({ onStartNewChat }: ClosedChatBannerProps) {
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-4 py-5 text-center">
      <p className="text-sm font-semibold text-slate-900">Conversation Closed</p>
      <p className="mt-1 text-sm text-slate-600">
        This conversation has been resolved.
      </p>
      <button
        type="button"
        onClick={onStartNewChat}
        className="mt-4 rounded-lg bg-[var(--covers-blue)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Start New Chat
      </button>
    </div>
  );
}
