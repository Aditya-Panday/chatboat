import dynamic from "next/dynamic";

const StatsGridLazy = dynamic(
  () =>
    import("@/components/admin/dashboard/StatsGrid").then(
      (module) => module.StatsGrid,
    ),
  { loading: () => <StatsSkeleton /> },
);

const RecentChatsLazy = dynamic(
  () =>
    import("@/components/admin/dashboard/RecentChatsPanel").then(
      (module) => module.RecentChatsPanel,
    ),
  { loading: () => <TableSkeleton /> },
);

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
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome, Aditya 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500 sm:text-[15px]">
          Here&apos;s what&apos;s happening with your chatbots today.
        </p>
      </header>

      <StatsGridLazy />
      <RecentChatsLazy />
    </div>
  );
}
