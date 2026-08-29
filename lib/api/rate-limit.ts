import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/api/request";
import { ApiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export function enforceRateLimit(
  request: NextRequest | Request,
  scope: string,
  maxAttempts: number,
  windowMs: number,
) {
  const ip = getClientIp(request) ?? "unknown";
  const result = checkRateLimit(`${scope}:${ip}`, maxAttempts, windowMs);

  if (!result.allowed) {
    throw ApiError.rateLimited(
      `Too many requests. Try again in ${result.retryAfterSeconds}s.`,
    );
  }
}
