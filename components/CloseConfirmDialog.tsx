"use client";

type CloseConfirmDialogProps = {
  onCloseChat: () => void;
  onEndChat: () => void;
  onCancel: () => void;
};

export function CloseConfirmDialog({
  onCloseChat,
  onEndChat,
  onCancel,
}: CloseConfirmDialogProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-end justify-center bg-slate-900/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-chat-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
        <h3
          id="close-chat-title"
          className="text-[15px] font-semibold text-slate-900"
        >
          What would you like to do?
        </h3>
        <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
          Close Chat keeps your conversation. End Chat starts fresh from the
          welcome screen.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onCloseChat}
            className="rounded-xl bg-[var(--covers-blue)] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--covers-blue-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--covers-blue)]"
          >
            Close Chat
          </button>
          <button
            type="button"
            onClick={onEndChat}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--covers-blue)]"
          >
            End Chat
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-[13px] font-medium text-slate-500 transition hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
