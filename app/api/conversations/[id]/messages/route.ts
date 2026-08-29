import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { requireStaff } from "@/lib/auth/authorization";
import { SENDER_TYPE } from "@/lib/chat/domain";
import { sendSessionMessageSchema } from "@/lib/validation/chat.schema";
import { getConversation } from "@/services/chat/conversation.service";
import { createMessage } from "@/services/chat/message.service";
import { canAgentSendMessage } from "@/lib/chat/rbac";
import { ApiError } from "@/lib/api/response";
import { isAdmin } from "@/lib/auth/roles";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireStaff(request);
    const { id } = await context.params;
    const body = sendSessionMessageSchema.parse(await request.json());

    const { session } = await getConversation(id, user);

    if (
      !canAgentSendMessage({
        isAdmin: isAdmin(user),
        agentId: user.id,
        currentAgentId: session.currentAgentId,
        status: session.status,
      })
    ) {
      throw ApiError.forbidden();
    }

    const message = await createMessage({
      sessionId: id,
      senderType: SENDER_TYPE.AGENT,
      senderId: user.id,
      content: body.content,
    });

    return jsonSuccess(message, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
