import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { getClientIp, getUserAgent } from "@/lib/api/request";
import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";
import {
  clearAuthCookieOnResponse,
  getCurrentUserFromRequest,
} from "@/lib/auth/session";
import { logoutCurrentSession } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const rawToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const actor = await getCurrentUserFromRequest(request);

    await logoutCurrentSession(rawToken, actor, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    const response = NextResponse.json({
      success: true,
      data: { redirectTo: "/admin/login" },
    });
    clearAuthCookieOnResponse(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
