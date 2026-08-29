import dynamic from "next/dynamic";

const AgentLogsPanel = dynamic(
  () =>
    import("@/components/admin/logs/AgentLogsPanel").then(
      (module) => module.AgentLogsPanel,
    ),
  { loading: () => <LogsPanelSkeleton /> },
);

function LogsPanelSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-16 animate-pulse border-b border-slate-200 bg-slate-100/80" />
      <div className="h-72 animate-pulse bg-slate-50" />
      <div className="h-16 animate-pulse border-t border-slate-200 bg-slate-100/60" />
    </div>
  );
}

export default function AgentLogsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="hidden lg:block">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Agent Logs
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-[15px]">
          View comprehensive system activity and audit logs.
        </p>
      </header>

      <AgentLogsPanel />
    </div>
  );
}
