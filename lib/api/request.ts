import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest | Request): string | undefined {
  if ("headers" in request) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim();
    }
    return request.headers.get("x-real-ip") ?? undefined;
  }
  return undefined;
}

export function getUserAgent(request: NextRequest | Request): string | undefined {
  return request.headers.get("user-agent") ?? undefined;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
