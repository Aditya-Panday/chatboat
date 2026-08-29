import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import {
  getUnreadCount,
  listNotifications,
  markNotificationRead,
} from "@/services/chat/notification.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStaff(request);
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);

    const [notifications, unreadCount] = await Promise.all([
      listNotifications(user.id, limit),
      getUnreadCount(user.id),
    ]);

    return jsonSuccess({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
