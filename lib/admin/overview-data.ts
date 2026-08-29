import type { LucideIcon } from "lucide-react";
import { CheckCircle2, MessageSquare, Timer } from "lucide-react";

export type AnalyticsTrend = "up" | "down" | "neutral";

export type AnalyticsMetric = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: AnalyticsTrend;
  icon: LucideIcon;
  iconClassName: string;
  trendClassName: string;
};

export type ResolutionSegment = {
  id: string;
  label: string;
  value: number;
  color: string;
  percent: number;
};

export type AgentPerformanceStatus = "Online" | "Offline" | "Break";

export type TopAgent = {
  id: string;
  name: string;
  initials: string;
  avatarClassName: string;
  chatsHandled: number;
  avgResolutionTime: string;
  csatScore: number;
  status: AgentPerformanceStatus;
};

export const ANALYTICS_METRICS: AnalyticsMetric[] = [
  {
    id: "total-chats",
    label: "Total Chats",
    value: "14,285",
    change: "+12.5%",
    trend: "up",
    icon: MessageSquare,
    iconClassName: "bg-blue-50 text-blue-600",
    trendClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "resolved-rate",
    label: "Resolved Rate",
    value: "86.4%",
    change: "+5.2%",
    trend: "up",
    icon: CheckCircle2,
    iconClassName: "bg-emerald-50 text-emerald-600",
    trendClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "avg-response",
    label: "Avg Response Time",
    value: "4.2s",
    change: "-1.2s",
    trend: "down",
    icon: Timer,
    iconClassName: "bg-red-50 text-red-500",
    trendClassName: "bg-emerald-50 text-emerald-600",
  },
];

export const RESOLUTION_SEGMENTS: ResolutionSegment[] = [
  {
    id: "bot",
    label: "Resolved by Bot",
    value: 10713,
    color: "#2563eb",
    percent: 75,
  },
  {
    id: "pending",
    label: "Pending",
    value: 1428,
    color: "#94a3b8",
    percent: 10,
  },
  {
    id: "escalated",
    label: "Escalated to Human",
    value: 2144,
    color: "#dc2626",
    percent: 15,
  },
];

export const RESOLUTION_CENTER_LABEL = "75%";
export const RESOLUTION_CENTER_SUBLABEL = "Resolved";

export const TOP_AGENTS: TopAgent[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    initials: "SJ",
    avatarClassName: "bg-blue-100 text-blue-700",
    chatsHandled: 432,
    avgResolutionTime: "12m 45s",
    csatScore: 4.9,
    status: "Online",
  },
  {
    id: "2",
    name: "Michael Chen",
    initials: "MC",
    avatarClassName: "bg-violet-100 text-violet-700",
    chatsHandled: 398,
    avgResolutionTime: "14m 10s",
    csatScore: 4.8,
    status: "Online",
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    initials: "ER",
    avatarClassName: "bg-slate-200 text-slate-600",
    chatsHandled: 350,
    avgResolutionTime: "15m 30s",
    csatScore: 4.7,
    status: "Offline",
  },
];

export const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
] as const;

export type DateRangeValue = (typeof DATE_RANGE_OPTIONS)[number]["value"];

export const AGENT_STATUS_STYLES: Record<AgentPerformanceStatus, string> = {
  Online: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Offline: "bg-slate-100 text-slate-500 ring-slate-200",
  Break: "bg-amber-50 text-amber-700 ring-amber-100",
};
