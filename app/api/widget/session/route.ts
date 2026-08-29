import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { WIDGET_SESSION_COOKIE } from "@/lib/chat/cookies";
import { setWidgetSessionCookie } from "@/lib/chat/cookies";
import { hashSessionToken } from "@/lib/auth/session-token";
import { startSessionSchema } from "@/lib/validation/chat.schema";
import {
  findSessionByTokenHash,
  resumeOrCreateSession,
} from "@/services/chat/session.service";

function getTokenFromRequest(request: NextRequest) {
  return request.cookies.get(WIDGET_SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, "widget:session", 20, 60_000);
    const body = await request.json();
    const input = startSessionSchema.parse(body);
    const tokenHash = getTokenFromRequest(request)
      ? hashSessionToken(getTokenFromRequest(request)!)
      : undefined;

    const result = await resumeOrCreateSession({
      tokenHash,
      visitorId: input.visitorId,
      guest: input.guest,
      customerId: input.customerId,
    });

    const response = jsonSuccess({
      session: result.session,
      created: result.created,
    });

    if (result.rawToken) {
      setWidgetSessionCookie(response, result.rawToken, result.expiresAt);
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const rawToken = getTokenFromRequest(request);
    if (!rawToken) {
      return jsonSuccess({ session: null });
    }

    const existing = await findSessionByTokenHash(hashSessionToken(rawToken));
    if (!existing) {
      return jsonSuccess({ session: null });
    }

    const { toSafeMessage, toSafeSession } = await import("@/lib/chat/types");

    return jsonSuccess({
      session: {
        ...toSafeSession(existing),
        messages: existing.messages.map(toSafeMessage),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
