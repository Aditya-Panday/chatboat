import type { AgentLogEntry, LogDescriptionPart } from "@/lib/admin/logs-data";
import { LOG_EVENT_CONFIG } from "@/lib/admin/logs-data";

export function LogDescription({ parts }: { parts: LogDescriptionPart[] }) {
  return (
    <p className="text-sm text-slate-600">
      {parts.map((part, index) =>
        part.bold ? (
          <strong key={index} className="font-semibold text-slate-800">
            {part.text}
          </strong>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </p>
  );
}

export function LogEventBadge({
  eventType,
  compact = false,
}: {
  eventType: AgentLogEntry["eventType"];
  compact?: boolean;
}) {
  const config = LOG_EVENT_CONFIG[eventType];
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconWrapClassName}`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.iconWrapClassName}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className={`text-sm font-semibold ${config.badgeClassName}`}>
        {config.label}
      </span>
    </div>
  );
}

export function LogUserCell({ user }: { user: AgentLogEntry["user"] }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${user.avatarClassName}`}
      >
        {user.initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
        <p className="truncate text-xs text-slate-400">{user.role}</p>
      </div>
    </div>
  );
}
