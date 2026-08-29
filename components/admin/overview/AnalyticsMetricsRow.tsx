import { ANALYTICS_METRICS } from "@/lib/admin/overview-data";
import { TrendingDown, TrendingUp } from "lucide-react";

export function AnalyticsMetricsRow() {
  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Analytics key metrics"
    >
      {ANALYTICS_METRICS.map((metric) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === "down" ? TrendingDown : TrendingUp;

        return (
          <article
            key={metric.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.iconClassName}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${metric.trendClassName}`}
              >
                <TrendIcon className="h-3.5 w-3.5" aria-hidden />
                {metric.change}
              </span>
            </div>

            <p className="mt-5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              {metric.label}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {metric.value}
            </p>
          </article>
        );
      })}
    </section>
  );
}
