"use client";

type ResolutionPromptProps = {
  disabled?: boolean;
  onResolved: () => void;
  onNeedMoreHelp: () => void;
  onTalkToAgent: () => void;
};

export function ResolutionPrompt({
  disabled,
  onResolved,
  onNeedMoreHelp,
  onTalkToAgent,
}: ResolutionPromptProps) {
  return (
    <div className="mx-3 mb-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">
        Has your query been resolved?
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onResolved}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Yes, close chat
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onNeedMoreHelp}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          I still need help
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onTalkToAgent}
          className="rounded-lg border border-[var(--covers-blue)] px-3 py-2 text-sm font-semibold text-[var(--covers-blue)] hover:bg-[var(--covers-blue-soft)] disabled:opacity-60"
        >
          Talk to an agent
        </button>
      </div>
    </div>
  );
}
