import { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/handler";
import { getClientIp, getUserAgent } from "@/lib/api/request";
import { setAuthCookieOnResponse } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth.schema";
import { loginStaffUser, toPublicUser } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);

    const result = await loginStaffUser(input.email, input.password, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    const response = jsonSuccess({
      user: toPublicUser(result.user),
      redirectTo: "/dashboard",
    });

    setAuthCookieOnResponse(response, result.rawToken, result.expiresAt);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
