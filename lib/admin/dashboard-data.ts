import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CloudUpload,
  Flag,
  MessageSquare,
} from "lucide-react";

export type StatTrend = "up" | "down" | "neutral";

export type DashboardStat = {
  id: string;
  label: string;
  value: number;
  change: string;
  trend: StatTrend;
  icon: LucideIcon;
  iconClassName: string;
};

export type ChatStatus = "Open" | "In Progress" | "Closed";

export type RecentChat = {
  id: string;
  customer: { name: string; initials: string; avatarClassName: string };
  subject: string;
  agent: string;
  status: ChatStatus;
  time: string;
};

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

export const DASHBOARD_STATS: DashboardStat[] = [
  {
    id: "today",
    label: "Today's Chats",
    value: 24,
    change: "+12%",
    trend: "up",
    icon: MessageSquare,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    id: "open",
    label: "Open Chats",
    value: 8,
    change: "0%",
    trend: "neutral",
    icon: Flag,
    iconClassName: "bg-red-50 text-red-500",
  },
  {
    id: "week",
    label: "Last Week",
    value: 142,
    change: "+5%",
    trend: "up",
    icon: CloudUpload,
    iconClassName: "bg-slate-100 text-slate-500",
  },
  {
    id: "month",
    label: "This Month",
    value: 628,
    change: "-2%",
    trend: "down",
    icon: CalendarDays,
    iconClassName: "bg-slate-100 text-slate-500",
  },
];

export const RECENT_CHATS: RecentChat[] = [
  {
    id: "1",
    customer: {
      name: "Sarah Jenkins",
      initials: "SJ",
      avatarClassName: "bg-blue-100 text-blue-700",
    },
    subject: "Billing Issue",
    agent: "Mike R.",
    status: "Open",
    time: "10:42 AM",
  },
  {
    id: "2",
    customer: {
      name: "Michael Ross",
      initials: "MR",
      avatarClassName: "bg-slate-100 text-slate-600",
    },
    subject: "Product Inquiry",
    agent: "Sarah L.",
    status: "In Progress",
    time: "09:15 AM",
  },
  {
    id: "3",
    customer: {
      name: "Alice Liu",
      initials: "AL",
      avatarClassName: "bg-violet-100 text-violet-700",
    },
    subject: "Feature Request",
    agent: "Mike R.",
    status: "Closed",
    time: "Yesterday",
  },
  {
    id: "4",
    customer: {
      name: "David Kim",
      initials: "DK",
      avatarClassName: "bg-emerald-100 text-emerald-700",
    },
    subject: "Shipping Delay",
    agent: "Sarah L.",
    status: "Open",
    time: "Yesterday",
  },
];

export const ADMIN_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "1",
    title: "New chat waiting",
    message: "Sarah Jenkins requested live agent support.",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "Chat assigned to you",
    message: "Michael Ross was assigned to Demo Agent.",
    time: "18 min ago",
    unread: true,
  },
  {
    id: "3",
    title: "Session closed",
    message: "Alice Liu marked chat as resolved.",
    time: "1 hr ago",
    unread: false,
  },
  {
    id: "4",
    title: "High queue volume",
    message: "8 open chats are waiting for agent assignment.",
    time: "3 hr ago",
    unread: false,
  },
];

export const STATUS_STYLES: Record<ChatStatus, string> = {
  Open: "bg-red-50 text-red-600 ring-red-100",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-100",
  Closed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export const TREND_STYLES: Record<StatTrend, string> = {
  up: "bg-emerald-50 text-emerald-600",
  down: "bg-red-50 text-red-500",
  neutral: "bg-slate-100 text-slate-500",
};
