import type {
  ChatFilterTab,
  ChatMessage,
  Conversation,
  SessionStatus,
} from "@/lib/admin/chats-data";
import {
  avatarClassForName,
  customerInitials,
  formatChatTime,
} from "@/lib/admin/format-time";
import { mapStatusLabel } from "@/lib/chat/domain";
import type { ChatSessionStatus } from "@prisma/client";

type ApiListResponse<T> = {
  success: true;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type ApiSuccess<T> = { success: true; data: T };

async function parseApi<T>(response: Response): Promise<T> {
  const json = (await response.json()) as ApiSuccess<T> | { success: false; error: { message: string } };
  if (!json.success) {
    throw new Error("error" in json ? json.error.message : "Request failed");
  }
  return json.data;
}

function filterToApiStatus(tab: ChatFilterTab): string {
  switch (tab) {
    case "unassigned":
      return "waiting";
    case "resolved":
      return "closed";
    default:
      return "all";
  }
}

export function mapConversationRow(row: {
  id: string;
  subject: string | null;
  status: string;
  statusLabel?: string;
  preview?: string | null;
  lastMessageAt?: string | Date | null;
  startedAt: string | Date;
  customer?: { name: string; email: string | null } | null;
  currentAgent?: { name: string } | null;
}): Conversation {
  const customerName = row.customer?.name ?? "Guest";
  const sessionStatus = row.status as SessionStatus;
  const statusLabel =
    row.statusLabel ??
    mapStatusLabel(row.status as ChatSessionStatus);
  const inboxStatus =
    sessionStatus === "CLOSED"
      ? ("resolved" as const)
      : sessionStatus === "WAITING_FOR_AGENT"
        ? ("unassigned" as const)
        : ("open" as const);

  return {
    id: row.id,
    customer: {
      name: customerName,
      initials: customerInitials(customerName),
      avatarClassName: avatarClassForName(customerName),
      status: sessionStatus === "CLOSED" ? "offline" : "online",
      source: row.customer?.email ?? "Web Widget",
    },
    preview: row.preview ?? row.subject ?? "New Conversation",
    time: formatChatTime(row.lastMessageAt ?? row.startedAt),
    unreadCount: 0,
    status: inboxStatus,
    sessionStatus,
    statusLabel,
  };
}

export function mapApiMessages(
  messages: Array<{
    id: string;
    senderType: string;
    content: string | null;
    createdAt: string | Date;
  }>,
): ChatMessage[] {
  return messages.map((message) => {
    const time = formatChatTime(message.createdAt);
    const content = message.content ?? "";

    if (message.senderType === "SYSTEM") {
      return { id: message.id, type: "system", content };
    }
    if (message.senderType === "CUSTOMER") {
      return { id: message.id, type: "customer", content, time };
    }
    if (message.senderType === "AGENT") {
      return {
        id: message.id,
        type: "agent",
        content,
        time,
        seen: true,
      };
    }
    return { id: message.id, type: "ai", content, time };
  });
}

export async function fetchConversations(params: {
  tab: ChatFilterTab;
  search?: string;
  page?: number;
}) {
  const query = new URLSearchParams({
    status: filterToApiStatus(params.tab),
    page: String(params.page ?? 1),
    limit: "30",
  });
  if (params.search) query.set("search", params.search);

  const response = await fetch(`/api/conversations?${query.toString()}`, {
    credentials: "include",
  });

  const json = (await response.json()) as ApiListResponse<Parameters<typeof mapConversationRow>[0]>;
  if (!json.success) throw new Error("Failed to load conversations");

  return {
    conversations: json.data.map(mapConversationRow),
    pagination: json.pagination,
  };
}

export async function fetchConversationDetail(id: string) {
  const response = await fetch(`/api/conversations/${id}`, {
    credentials: "include",
  });

  const data = await parseApi<{
    session: Parameters<typeof mapConversationRow>[0];
    messages: Parameters<typeof mapApiMessages>[0];
  }>(response);

  return {
    conversation: mapConversationRow({
      ...data.session,
      preview: data.messages.at(-1)?.content ?? null,
    }),
    messages: mapApiMessages(data.messages),
  };
}

export async function sendAgentMessage(sessionId: string, content: string) {
  const response = await fetch(`/api/conversations/${sessionId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  return parseApi(response);
}

export async function resolveConversation(sessionId: string) {
  const response = await fetch(`/api/conversations/${sessionId}/resolve`, {
    method: "POST",
    credentials: "include",
  });

  return parseApi(response);
}

export async function assignConversation(sessionId: string, agentId: string) {
  const response = await fetch(`/api/conversations/${sessionId}/assign`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId }),
  });

  return parseApi(response);
}

export async function fetchAvailableAgents() {
  const response = await fetch("/api/agents/available", {
    credentials: "include",
  });

  return parseApi<
    Array<{
      id: string;
      name: string;
      activeChatCount: number;
      status: string;
      isOnline: boolean;
    }>
  >(response);
}
