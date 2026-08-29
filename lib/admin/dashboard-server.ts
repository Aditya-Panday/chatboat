import {
  Bot,
  Clock3,
  MessageSquare,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import {
  avatarClassForName,
  customerInitials,
  formatChatTime,
} from "@/lib/admin/format-time";
import { mapStatusLabel } from "@/lib/chat/domain";
import {
  getDashboardStats,
  listConversations,
} from "@/services/chat/conversation.service";

export async function loadDashboardStats() {
  const user = await getCurrentUser();
  if (!user) return null;

  const stats = await getDashboardStats(user);

  if (isAdmin(user)) {
    return [
      {
        id: "open",
        label: "Open Chats",
        value: stats.openChats,
        icon: MessageSquare,
        iconClassName: "bg-red-50 text-red-500",
      },
      {
        id: "waiting",
        label: "Waiting",
        value: stats.waiting,
        icon: Clock3,
        iconClassName: "bg-amber-50 text-amber-600",
      },
      {
        id: "assigned",
        label: "Assigned",
        value: stats.assigned,
        icon: Bot,
        iconClassName: "bg-blue-50 text-blue-600",
      },
      {
        id: "agents",
        label: "Agents Online",
        value: stats.agentsOnline,
        icon: Users,
        iconClassName: "bg-emerald-50 text-emerald-600",
      },
    ];
  }

  return [
    {
      id: "assigned",
      label: "My Active Chats",
      value: stats.assigned,
      icon: MessageSquare,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      id: "waiting",
      label: "Waiting",
      value: stats.waiting,
      icon: Clock3,
      iconClassName: "bg-amber-50 text-amber-600",
    },
    {
      id: "ai",
      label: "AI Chats",
      value: stats.aiChats,
      icon: Bot,
      iconClassName: "bg-violet-50 text-violet-600",
    },
    {
      id: "closed",
      label: "Closed Today",
      value: stats.closedToday,
      icon: Users,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
  ];
}

export async function loadRecentChats(limit = 8) {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await listConversations({
    user,
    page: 1,
    limit,
    filter: "all",
  });

  return data.map((chat) => {
    const customerName = chat.customer?.name ?? "Guest";
    return {
      id: chat.id,
      customer: {
        name: customerName,
        initials: customerInitials(customerName),
        avatarClassName: avatarClassForName(customerName),
      },
      subject: chat.subject ?? "New Conversation",
      agent: chat.currentAgent?.name ?? "—",
      status: mapStatusLabel(chat.status),
      time: formatChatTime(chat.lastMessageAt ?? chat.startedAt),
    };
  });
}
