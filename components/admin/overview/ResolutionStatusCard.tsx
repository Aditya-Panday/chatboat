import {
  RESOLUTION_CENTER_LABEL,
  RESOLUTION_CENTER_SUBLABEL,
  RESOLUTION_SEGMENTS,
} from "@/lib/admin/overview-data";

const SIZE = 200;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export function ResolutionStatusCard() {
  const segmentCircles = RESOLUTION_SEGMENTS.reduce<
    Array<{ segment: (typeof RESOLUTION_SEGMENTS)[number]; dash: number; offset: number }>
  >((acc, segment) => {
    const dash = (segment.percent / 100) * CIRCUMFERENCE;
    const offset = acc.reduce((sum, item) => sum + item.dash, 0);
    acc.push({ segment, dash, offset });
    return acc;
  }, []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
        Resolution Status
      </h3>

      <div className="mt-6 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="relative shrink-0">
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={`${RESOLUTION_CENTER_LABEL} ${RESOLUTION_CENTER_SUBLABEL}`}
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={STROKE}
            />
            {segmentCircles.map(({ segment, dash, offset }) => (
              <circle
                key={segment.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">
              {RESOLUTION_CENTER_LABEL}
            </span>
            <span className="text-sm text-slate-500">
              {RESOLUTION_CENTER_SUBLABEL}
            </span>
          </div>
        </div>

        <ul className="w-full max-w-sm space-y-4 lg:max-w-none lg:flex-1">
          {RESOLUTION_SEGMENTS.map((segment) => (
            <li
              key={segment.id}
              className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden
                />
                <span className="truncate text-sm text-slate-600">
                  {segment.label}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-900">
                {formatCount(segment.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
