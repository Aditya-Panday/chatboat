import { WIDGET_SESSION_COOKIE } from "@/lib/chat/domain";

const BASE_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export function serializeWidgetCookie(
  name: string,
  value: string,
  expires: Date,
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${BASE_COOKIE.path}`,
    "HttpOnly",
    `SameSite=${BASE_COOKIE.sameSite === "lax" ? "Lax" : "Strict"}`,
  ];

  if (BASE_COOKIE.secure) parts.push("Secure");
  parts.push(`Expires=${expires.toUTCString()}`);

  return parts.join("; ");
}

export function setWidgetSessionCookie(response: Response, token: string, expiresAt: Date) {
  if (!token) return;
  response.headers.append(
    "Set-Cookie",
    serializeWidgetCookie(WIDGET_SESSION_COOKIE, token, expiresAt),
  );
}

export function clearWidgetSessionCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    serializeWidgetCookie(WIDGET_SESSION_COOKIE, "", new Date(0)),
  );
}

export { WIDGET_SESSION_COOKIE };
