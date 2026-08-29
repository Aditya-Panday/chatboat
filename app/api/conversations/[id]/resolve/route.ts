import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { resolveConversation, getConversation } from "@/services/chat/conversation.service";
import { ApiError } from "@/lib/api/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireStaff(request);
    const { id } = await context.params;

    const { session } = await getConversation(id, user);

    if (session.currentAgentId && session.currentAgentId !== user.id) {
      const { isAdmin } = await import("@/lib/auth/roles");
      if (!isAdmin(user)) {
        throw ApiError.forbidden("You can only resolve chats assigned to you.");
      }
    }

    const resolved = await resolveConversation({
      sessionId: id,
      agentId: user.id,
      agentName: user.name,
    });

    return jsonSuccess(resolved);
  } catch (error) {
    return handleApiError(error);
  }
}
