import { ApiError } from "@/lib/api/response";
import { AUDIT_ACTIONS, GENERIC_LOGIN_ERROR } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import {
  createAuthSession,
  hashSessionToken,
  revokeAuthSession,
  revokeAllUserSessions,
} from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { normalizeEmail } from "@/lib/api/request";
import { prisma } from "@/lib/db";
import { createAuditLog, sanitizeAuditData } from "@/services/audit.service";

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

type LoginContext = {
  ipAddress?: string;
  userAgent?: string;
};

export async function loginStaffUser(
  emailInput: string,
  password: string,
  context: LoginContext,
) {
  const email = normalizeEmail(emailInput);
  const rateLimitKey = `login:${context.ipAddress ?? "unknown"}:${email}`;
  const rateLimit = checkRateLimit(rateLimitKey, 8, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    throw ApiError.rateLimited(
      `Too many login attempts. Try again in ${rateLimit.retryAfterSeconds}s.`,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: USER_WITH_RBAC_INCLUDE,
  });

  const failureAudit = async () => {
    await createAuditLog(
      AUDIT_ACTIONS.LOGIN_FAILED,
      "user",
      user?.id ?? email,
      {
        actorId: user?.id ?? null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      undefined,
      sanitizeAuditData({ email }),
    );
  };

  if (!user || !user.passwordHash || user.userType !== "STAFF") {
    await failureAudit();
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    await failureAudit();
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  if (!user.isActive) {
    await failureAudit();
    throw ApiError.unauthorized("Your account has been deactivated.");
  }

  resetRateLimit(rateLimitKey);

  const session = await createAuthSession(user.id, context);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  await createAuditLog(
    AUDIT_ACTIONS.LOGIN_SUCCESS,
    "user",
    user.id,
    {
      actorId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
    undefined,
    sanitizeAuditData({ email: user.email, userType: user.userType }),
  );

  const safeUser = mapUserToAuthenticated(user);
  if (!safeUser) {
    throw ApiError.internal();
  }

  return { ...session, user: safeUser };
}

export async function logoutCurrentSession(
  rawToken: string | undefined,
  actor: AuthenticatedUser | null,
  context: LoginContext,
) {
  if (rawToken) {
    await revokeAuthSession(hashSessionToken(rawToken));
  }

  if (actor) {
    await createAuditLog(
      AUDIT_ACTIONS.LOGOUT,
      "user",
      actor.id,
      {
        actorId: actor.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    );
  }
}

export async function invalidateUserSessions(userId: string) {
  await revokeAllUserSessions(userId);
}

function mapUserToAuthenticated(
  user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>> & {
    userRoles: Array<{
      role: {
        id: string;
        name: string;
        description: string | null;
        rolePermissions: Array<{ permission: { name: string } }>;
      };
    }>;
  },
): AuthenticatedUser {
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

export function toPublicUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.userType,
    roles: user.roles.map(({ name }) => ({ name })),
    permissions: user.permissions,
  };
}
