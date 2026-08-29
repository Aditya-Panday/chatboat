import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { getConversation } from "@/services/chat/conversation.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireStaff(request);
    const { id } = await context.params;
    const result = await getConversation(id, user);
    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
