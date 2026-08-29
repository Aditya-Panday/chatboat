import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { WIDGET_SESSION_COOKIE } from "@/lib/chat/cookies";
import { hashSessionToken } from "@/lib/auth/session-token";
import { handoffSchema } from "@/lib/validation/chat.schema";
import { findSessionByTokenHash } from "@/services/chat/session.service";
import { requestAgentHandoff } from "@/services/chat/handoff.service";
import { ApiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "widget:handoff", 5, 60_000);
    const rawToken = request.cookies.get(WIDGET_SESSION_COOKIE)?.value;
    if (!rawToken) throw ApiError.unauthorized("Chat session not found.");

    const session = await findSessionByTokenHash(hashSessionToken(rawToken));
    if (!session) throw ApiError.unauthorized("Chat session expired.");

    handoffSchema.parse(await request.json().catch(() => ({})));

    const result = await requestAgentHandoff(
      session.id,
      session.customerId ?? undefined,
    );

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
