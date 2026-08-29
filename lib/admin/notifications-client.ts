import { formatChatTime } from "@/lib/admin/format-time";

export type AdminNotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  sessionId?: string | null;
};

type ApiSuccess<T> = { success: true; data: T };

async function parseApi<T>(response: Response): Promise<T> {
  const json = (await response.json()) as
    | ApiSuccess<T>
    | { success: false; error: { message: string } };
  if (!json.success) {
    throw new Error("error" in json ? json.error.message : "Request failed");
  }
  return json.data;
}

export async function fetchNotifications(limit = 20) {
  const response = await fetch(`/api/notifications?limit=${limit}`, {
    credentials: "include",
  });

  const data = await parseApi<{
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
      sessionId: string | null;
    }>;
    unreadCount: number;
  }>(response);

  return {
    unreadCount: data.unreadCount,
    notifications: data.notifications.map(
      (item): AdminNotificationItem => ({
        id: item.id,
        title: item.title,
        message: item.message,
        unread: !item.isRead,
        time: formatChatTime(item.createdAt),
        sessionId: item.sessionId,
      }),
    ),
  };
}

export async function markNotificationRead(id: string) {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseApi(response);
}

export async function markAllNotificationsRead() {
  const response = await fetch("/api/notifications/read-all", {
    method: "PATCH",
    credentials: "include",
  });
  return parseApi(response);
}
