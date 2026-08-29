import dynamic from "next/dynamic";

const OverviewHeader = dynamic(
  () =>
    import("@/components/admin/overview/OverviewHeader").then(
      (module) => module.OverviewHeader,
    ),
);

const AnalyticsMetricsRow = dynamic(
  () =>
    import("@/components/admin/overview/AnalyticsMetricsRow").then(
      (module) => module.AnalyticsMetricsRow,
    ),
  { loading: () => <MetricsSkeleton /> },
);

const ResolutionStatusCard = dynamic(
  () =>
    import("@/components/admin/overview/ResolutionStatusCard").then(
      (module) => module.ResolutionStatusCard,
    ),
  { loading: () => <CardSkeleton height="h-72" /> },
);

const TopAgentsTable = dynamic(
  () =>
    import("@/components/admin/overview/TopAgentsTable").then(
      (module) => module.TopAgentsTable,
    ),
  { loading: () => <CardSkeleton height="h-80" /> },
);

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-xl bg-slate-200/70"
          aria-hidden
        />
      ))}
    </div>
  );
}

function CardSkeleton({ height }: { height: string }) {
  return (
    <div
      className={`${height} animate-pulse rounded-xl bg-slate-200/70`}
      aria-hidden
    />
  );
}

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <OverviewHeader />
      <AnalyticsMetricsRow />
      <ResolutionStatusCard />
      <TopAgentsTable />
    </div>
  );
}
