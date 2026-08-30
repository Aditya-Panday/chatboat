import { Suspense } from "react";
import { DashboardWelcome } from "@/components/admin/dashboard/DashboardWelcome";
import {
  OverviewStatsGridServer,
  StatsGridServer,
  RecentChatsServer,
} from "@/components/admin/dashboard/DashboardData";

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-xl bg-slate-200/70"
          aria-hidden
        />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-xl bg-slate-200/70" aria-hidden />
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardWelcome />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsGridServer />
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <OverviewStatsGridServer />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentChatsServer />
      </Suspense>
    </div>
  );
}
