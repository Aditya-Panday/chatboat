import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  buildAuthCookie,
  buildClearAuthCookie,
  getSessionExpiryDate,
} from "@/lib/auth/cookies";
import {
  generateSessionToken,
  hashSessionToken,
} from "@/lib/auth/session-token";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db";

const USER_WITH_RBAC_INCLUDE = {
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} as const;

function mapUserToAuthenticated(
  user: Awaited<ReturnType<typeof loadUserWithRbac>>,
): AuthenticatedUser | null {
  if (!user) return null;

  const roles = user.userRoles.map(({ role }) => ({
    id: role.id,
    name: role.name,
    description: role.description,
  }));

  const permissionSet = new Set<string>();
  for (const { role } of user.userRoles) {
    for (const { permission } of role.rolePermissions) {
      permissionSet.add(permission.name);
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    userType: user.userType,
    isActive: user.isActive,
    isOnline: user.isOnline,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles,
    permissions: [...permissionSet],
  };
}

async function loadUserWithRbac(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: USER_WITH_RBAC_INCLUDE,
  });
}

export async function createAuthSession(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string },
) {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = getSessionExpiryDate();

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  return { rawToken, expiresAt };
}

export async function revokeAuthSession(tokenHash: string) {
  await prisma.authSession.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

async function resolveSessionFromToken(rawToken: string | undefined) {
  if (!rawToken) return null;

  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (!session || session.revokedAt) return null;
  if (session.expiresAt <= new Date()) return null;

  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  const user = await loadUserWithRbac(session.userId);
  if (!user || !user.isActive || user.userType !== "STAFF") {
    await revokeAuthSession(tokenHash);
    return null;
  }

  return mapUserToAuthenticated(user);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return resolveSessionFromToken(rawToken);
}

export async function getCurrentUserFromRequest(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
  const rawToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return resolveSessionFromToken(rawToken);
}

export function setAuthCookieOnResponse(
  response: Response,
  rawToken: string,
  expiresAt: Date,
) {
  const cookie = buildAuthCookie(rawToken, expiresAt);
  response.headers.append(
    "Set-Cookie",
    serializeCookie(cookie.name, cookie.value, cookie),
  );
}

export function clearAuthCookieOnResponse(response: Response) {
  const cookie = buildClearAuthCookie();
  response.headers.append(
    "Set-Cookie",
    serializeCookie(cookie.name, cookie.value, cookie),
  );
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    path: string;
    expires?: Date;
    maxAge?: number;
  },
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
  ];

  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  parts.push(`SameSite=${capitalize(options.sameSite)}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);

  return parts.join("; ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export { buildAuthCookie, buildClearAuthCookie, hashSessionToken };
