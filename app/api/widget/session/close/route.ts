import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { WIDGET_SESSION_COOKIE, clearWidgetSessionCookie } from "@/lib/chat/cookies";
import { hashSessionToken } from "@/lib/auth/session-token";
import { CLOSE_REASON, SESSION_EVENT } from "@/lib/chat/domain";
import { closeSessionSchema } from "@/lib/validation/chat.schema";
import { closeSession, findSessionByTokenHash } from "@/services/chat/session.service";
import { createSystemMessage } from "@/services/chat/message.service";
import { publishRealtimeEvent } from "@/lib/realtime/pubsub";
import { ApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "widget:close", 10, 60_000);
    const rawToken = request.cookies.get(WIDGET_SESSION_COOKIE)?.value;
    if (!rawToken) throw ApiError.unauthorized("Chat session not found.");

    const session = await findSessionByTokenHash(hashSessionToken(rawToken));
    if (!session) throw ApiError.unauthorized("Chat session expired.");

    const body = closeSessionSchema.parse(await request.json().catch(() => ({})));

    const closeReason =
      body.reason === "AI_RESOLVED"
        ? CLOSE_REASON.AI_RESOLVED
        : CLOSE_REASON.CUSTOMER_CLOSED;

    if (body.reason === "AI_RESOLVED") {
      await createSystemMessage(session.id, "Chat closed by AI");
    }

    const closed = await closeSession({
      sessionId: session.id,
      closedById: session.customerId,
      closeReason,
      actorType: body.reason === "AI_RESOLVED" ? "AI" : "CUSTOMER",
      eventType: SESSION_EVENT.CUSTOMER_CLOSED,
    });

    publishRealtimeEvent({
      type: "conversation.closed",
      sessionId: session.id,
      payload: closed,
    });

    const response = jsonSuccess(closed);
    clearWidgetSessionCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
