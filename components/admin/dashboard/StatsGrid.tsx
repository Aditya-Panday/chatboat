import type { LucideIcon } from "lucide-react";

export type DashboardStatItem = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
};

type StatsGridProps = {
  stats: DashboardStatItem[];
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      aria-label="Dashboard statistics"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <article
            key={stat.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconClassName}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">{stat.label}</p>
          </article>
        );
      })}
    </section>
  );
}
