import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { markAllNotificationsRead } from "@/services/chat/notification.service";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireStaff(request);
    const result = await markAllNotificationsRead(user.id);
    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
