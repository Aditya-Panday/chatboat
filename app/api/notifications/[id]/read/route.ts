import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { markNotificationRead } from "@/services/chat/notification.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireStaff(request);
    const { id } = await context.params;
    const result = await markNotificationRead(id, user.id);
    return jsonSuccess(result ?? { read: false });
  } catch (error) {
    return handleApiError(error);
  }
}
