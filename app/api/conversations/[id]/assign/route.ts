import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { assignSessionSchema } from "@/lib/validation/chat.schema";
import { assignConversation } from "@/services/chat/assignment.service";
import { getConversation } from "@/services/chat/conversation.service";
import { isAdmin } from "@/lib/auth/roles";
import { ApiError } from "@/lib/api/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireStaff(request);
    if (!isAdmin(user)) {
      throw ApiError.forbidden("Only administrators can assign conversations.");
    }

    const { id } = await context.params;
    const body = assignSessionSchema.parse(await request.json());

    await getConversation(id, user);

    const existing = await assignConversation({
      sessionId: id,
      agentId: body.agentId,
      assignedById: user.id,
      assignmentType: "ADMIN",
    });

    return jsonSuccess(existing);
  } catch (error) {
    return handleApiError(error);
  }
}
