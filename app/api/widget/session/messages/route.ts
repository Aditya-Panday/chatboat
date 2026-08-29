import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { WIDGET_SESSION_COOKIE } from "@/lib/chat/cookies";
import { hashSessionToken } from "@/lib/auth/session-token";
import { SENDER_TYPE } from "@/lib/chat/domain";
import { sendSessionMessageSchema } from "@/lib/validation/chat.schema";
import { findSessionByTokenHash } from "@/services/chat/session.service";
import { createMessage } from "@/services/chat/message.service";
import { ApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "widget:message", 40, 60_000);
    const rawToken = request.cookies.get(WIDGET_SESSION_COOKIE)?.value;
    if (!rawToken) throw ApiError.unauthorized("Chat session not found.");

    const session = await findSessionByTokenHash(hashSessionToken(rawToken));
    if (!session) throw ApiError.unauthorized("Chat session expired.");

    const body = await request.json();
    const input = sendSessionMessageSchema.parse(body);

    const message = await createMessage({
      sessionId: session.id,
      senderType: SENDER_TYPE.CUSTOMER,
      senderId: session.customerId,
      content: input.content,
    });

    return jsonSuccess(message, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
