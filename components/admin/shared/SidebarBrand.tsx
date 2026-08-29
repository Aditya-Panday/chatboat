import { Bot } from "lucide-react";

type SidebarBrandProps = {
  compact?: boolean;
};

export function SidebarBrand({ compact = false }: SidebarBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "px-1"}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--covers-blue)] text-white shadow-sm">
        <Bot className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold tracking-tight text-slate-900">
          Covers&All
        </p>
        {!compact ? (
          <p className="truncate text-xs text-slate-500">Admin Console</p>
        ) : null}
      </div>
    </div>
  );
}
