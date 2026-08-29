import { OverviewDateFilter } from "@/components/admin/overview/OverviewDateFilter";

export function OverviewHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Analytics Overview
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-[15px]">
          Comprehensive view of chatbot performance and agent metrics.
        </p>
      </div>
      <OverviewDateFilter />
    </header>
  );
}
