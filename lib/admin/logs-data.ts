import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  UserPlus,
} from "lucide-react";

export type LogEventType =
  | "CHAT_ASSIGNED"
  | "CHAT_CLOSED"
  | "USER_CREATED"
  | "AUTH_FAILED"
  | "API_RATE_LIMIT";

export type LogDescriptionPart = {
  text: string;
  bold?: boolean;
};

export type LogUser = {
  name: string;
  role: string;
  initials: string;
  avatarClassName: string;
  isSystem?: boolean;
};

export type AgentLogEntry = {
  id: string;
  eventType: LogEventType;
  descriptionParts: LogDescriptionPart[];
  user: LogUser;
  timestamp: string;
  shortTimestamp: string;
};

export type LogEventConfig = {
  label: string;
  icon: LucideIcon;
  badgeClassName: string;
  iconWrapClassName: string;
};

export const LOG_EVENT_CONFIG: Record<LogEventType, LogEventConfig> = {
  CHAT_ASSIGNED: {
    label: "Chat Assigned",
    icon: MessageSquare,
    badgeClassName: "text-blue-600",
    iconWrapClassName: "bg-blue-50 text-blue-600",
  },
  CHAT_CLOSED: {
    label: "Chat Closed",
    icon: CheckCircle2,
    badgeClassName: "text-emerald-600",
    iconWrapClassName: "bg-emerald-50 text-emerald-600",
  },
  USER_CREATED: {
    label: "User Created",
    icon: UserPlus,
    badgeClassName: "text-orange-600",
    iconWrapClassName: "bg-orange-50 text-orange-600",
  },
  AUTH_FAILED: {
    label: "Auth Failed",
    icon: AlertTriangle,
    badgeClassName: "text-red-600",
    iconWrapClassName: "bg-red-50 text-red-600",
  },
  API_RATE_LIMIT: {
    label: "API Rate Limit Exceeded",
    icon: AlertTriangle,
    badgeClassName: "text-red-600",
    iconWrapClassName: "bg-red-50 text-red-500",
  },
};

export const LOG_EVENT_FILTER_OPTIONS = [
  { value: "all", label: "All Event Types" },
  { value: "CHAT_ASSIGNED", label: "Chat Assigned" },
  { value: "CHAT_CLOSED", label: "Chat Closed" },
  { value: "USER_CREATED", label: "User Created" },
  { value: "AUTH_FAILED", label: "Auth Failed" },
  { value: "API_RATE_LIMIT", label: "API Rate Limit" },
] as const;

export type LogEventFilterValue =
  (typeof LOG_EVENT_FILTER_OPTIONS)[number]["value"];

const SAMPLE_LOGS: Omit<AgentLogEntry, "id">[] = [
  {
    eventType: "CHAT_ASSIGNED",
    descriptionParts: [
      { text: "Aditya assigned " },
      { text: "Sarah Jenkins", bold: true },
      { text: " to " },
      { text: "Michael Chen", bold: true },
    ],
    user: {
      name: "Aditya",
      role: "Admin",
      initials: "A",
      avatarClassName: "bg-[var(--covers-blue)] text-white",
    },
    timestamp: "Today, 10:45 AM",
    shortTimestamp: "10:42 AM",
  },
  {
    eventType: "CHAT_CLOSED",
    descriptionParts: [
      { text: "Agent " },
      { text: "Michael Chen", bold: true },
      { text: " closed chat session " },
      { text: "#8421", bold: true },
    ],
    user: {
      name: "Michael Chen",
      role: "Agent",
      initials: "MC",
      avatarClassName: "bg-violet-100 text-violet-700",
    },
    timestamp: "Today, 09:30 AM",
    shortTimestamp: "09:15 AM",
  },
  {
    eventType: "USER_CREATED",
    descriptionParts: [
      { text: "Admin created new agent account for " },
      { text: "Elena Rodriguez", bold: true },
    ],
    user: {
      name: "Aditya",
      role: "Admin",
      initials: "A",
      avatarClassName: "bg-[var(--covers-blue)] text-white",
    },
    timestamp: "Oct 14, 2023, 09:15 AM",
    shortTimestamp: "Yesterday",
  },
  {
    eventType: "AUTH_FAILED",
    descriptionParts: [
      { text: "Failed login attempt from IP " },
      { text: "192.168.1.45", bold: true },
    ],
    user: {
      name: "System",
      role: "Automated",
      initials: "S",
      avatarClassName: "bg-slate-200 text-slate-600",
      isSystem: true,
    },
    timestamp: "Oct 14, 2023, 08:02 AM",
    shortTimestamp: "Yesterday",
  },
  {
    eventType: "API_RATE_LIMIT",
    descriptionParts: [
      { text: "Endpoint " },
      { text: "/v1/users", bold: true },
      { text: " blocked temporarily" },
    ],
    user: {
      name: "System",
      role: "Automated",
      initials: "S",
      avatarClassName: "bg-slate-200 text-slate-600",
      isSystem: true,
    },
    timestamp: "Oct 13, 2023, 06:40 PM",
    shortTimestamp: "Yesterday",
  },
];

function buildGeneratedLogs(count: number): AgentLogEntry[] {
  const entries: AgentLogEntry[] = [];

  for (let index = 0; index < count; index += 1) {
    const sample = SAMPLE_LOGS[index % SAMPLE_LOGS.length];
    entries.push({
      ...sample,
      id: `log-${index + 1}`,
      timestamp:
        index < 4
          ? sample.timestamp
          : `Oct ${Math.max(1, 14 - (index % 14))}, 2023, ${9 + (index % 8)}:${10 + (index % 49)} AM`,
      shortTimestamp:
        index === 0
          ? "10:42 AM"
          : index < 3
            ? sample.shortTimestamp
            : index % 5 === 0
              ? "Yesterday"
              : `${8 + (index % 4)}:${String((index * 7) % 60).padStart(2, "0")} AM`,
    });
  }

  return entries;
}

export const AGENT_LOGS = buildGeneratedLogs(248);

export function formatLogDescription(parts: LogDescriptionPart[]): string {
  return parts.map((part) => part.text).join("");
}

export function matchesLogSearch(entry: AgentLogEntry, query: string): boolean {
  const haystack = [
    formatLogDescription(entry.descriptionParts),
    entry.user.name,
    entry.user.role,
    LOG_EVENT_CONFIG[entry.eventType].label,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}
