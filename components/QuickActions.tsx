"use client";

import { ChevronRight, type LucideIcon, PackageSearch, ShoppingBag } from "lucide-react";

export type QuickActionId = "new_order" | "existing_order";

type QuickActionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  onSelect: () => void;
};

export function QuickAction({
  title,
  description,
  icon: Icon,
  onSelect,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[var(--covers-blue)] hover:bg-[var(--covers-blue-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--covers-blue)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--covers-blue-soft)] text-[var(--covers-blue)]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-slate-900">
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] leading-5 text-slate-500">
          {description}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}

type QuickActionsProps = {
  onSelect: (id: QuickActionId) => void;
};

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <QuickAction
        title="New Order"
        description="Find a cover, fabric, or size"
        icon={ShoppingBag}
        onSelect={() => onSelect("new_order")}
      />
      <QuickAction
        title="Existing Order"
        description="Shipping, returns, or changes"
        icon={PackageSearch}
        onSelect={() => onSelect("existing_order")}
      />
    </div>
  );
}
