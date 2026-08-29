import {
  AUTH_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/auth/constants";

const BASE_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export function buildAuthCookie(token: string, expiresAt: Date) {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    ...BASE_COOKIE,
    expires: expiresAt,
  };
}

export function buildClearAuthCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    ...BASE_COOKIE,
    expires: new Date(0),
    maxAge: 0,
  };
}

export function getSessionExpiryDate(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_MS);
}

export { AUTH_COOKIE_NAME };
