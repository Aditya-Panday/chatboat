import type { Prisma } from "@prisma/client";
import {
  ApiError,
  buildPaginationMeta,
  isPrismaUniqueViolation,
} from "@/lib/api/response";
import { AUDIT_ACTIONS } from "@/lib/auth/constants";
import { hasAnyPermission, hasPermission, requireAdmin } from "@/lib/auth/authorization";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type {
  AuthenticatedUser,
  UserDetails,
  UserListItem,
} from "@/lib/auth/types";
import { normalizeEmail } from "@/lib/api/request";
import { prisma } from "@/lib/db";
import { createAuditLog, sanitizeAuditData } from "@/services/audit.service";
import { assertAssignableRole } from "@/services/role.service";
import { invalidateUserSessions } from "@/services/auth.service";
import type {
  CreateUserSchema,
  ListUsersSchema,
  UpdateRoleSchema,
  UpdateUserStatusSchema,
} from "@/lib/validation/user.schema";

type ServiceContext = {
  actor: AuthenticatedUser;
  ipAddress?: string;
  userAgent?: string;
};

const USER_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  userType: true,
  isActive: true,
  createdAt: true,
  lastSeenAt: true,
  userRoles: {
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

function mapListItem(
  user: Prisma.UserGetPayload<{ select: typeof USER_LIST_SELECT }>,
): UserListItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.userType,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt,
    roles: user.userRoles.map(({ role }) => role),
  };
}

function canManageUsers(actor: AuthenticatedUser) {
  return hasAnyPermission(actor, ["user.create", "user.read", "users.view"]);
}

function assertCanCreateUser(actor: AuthenticatedUser) {
  if (!hasAnyPermission(actor, ["user.create", "agent.create"])) {
    throw ApiError.forbidden();
  }
}

function assertCanReadUsers(actor: AuthenticatedUser) {
  if (!hasAnyPermission(actor, ["user.read", "users.view"])) {
    throw ApiError.forbidden();
  }
}

function assertCanUpdateUser(actor: AuthenticatedUser) {
  if (!hasAnyPermission(actor, ["user.update", "agent.update"])) {
    throw ApiError.forbidden();
  }
}

function assertCanBlockUser(actor: AuthenticatedUser) {
  if (!hasAnyPermission(actor, ["user.block", "agent.delete"])) {
    throw ApiError.forbidden();
  }
}

function assertCanChangePassword(
  actor: AuthenticatedUser,
  targetUserId: string,
) {
  if (actor.id === targetUserId) return;
  if (!hasAnyPermission(actor, ["user.password.update"])) {
    throw ApiError.forbidden();
  }
}

function assertCanChangeRole(actor: AuthenticatedUser) {
  if (!hasAnyPermission(actor, ["user.role.update"])) {
    throw ApiError.forbidden();
  }
}

export async function createUser(
  input: CreateUserSchema,
  context: ServiceContext,
) {
  requireAdmin(context.actor);
  assertCanCreateUser(context.actor);

  const email = normalizeEmail(input.email);
  const userType = input.userType ?? (input.role ? "STAFF" : "CUSTOMER");

  if (userType === "STAFF" && !input.role) {
    throw ApiError.badRequest("Role is required for staff users.");
  }

  if (userType === "CUSTOMER" && input.role) {
    throw ApiError.badRequest("Customers cannot be assigned staff roles.");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
          userType,
          isActive: true,
          isOnline: false,
        },
      });

      if (userType === "STAFF" && input.role) {
        const role = await assertAssignableRole(context.actor, input.role);
        await tx.userRole.create({
          data: {
            userId: created.id,
            roleId: role.id,
          },
        });

        if (input.role === "AGENT") {
          await tx.agentProfile.create({
            data: {
              userId: created.id,
              status: "OFFLINE",
              activeChatCount: 0,
              totalChatCount: 0,
            },
          });
        }
      }

      await createAuditLog(
        AUDIT_ACTIONS.USER_CREATED,
        "user",
        created.id,
        {
          actorId: context.actor.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        undefined,
        sanitizeAuditData({
          name: created.name,
          email: created.email,
          userType: created.userType,
          role: input.role,
        }),
      );

      return created;
    });

    const fullUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: USER_LIST_SELECT,
    });

    return mapListItem(fullUser);
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      throw ApiError.conflict("A user with this email already exists.");
    }
    throw error;
  }
}

export async function listUsers(
  query: ListUsersSchema,
  actor: AuthenticatedUser,
) {
  assertCanReadUsers(actor);

  const where: Prisma.UserWhereInput = {};

  if (query.userType) {
    where.userType = query.userType;
  }

  if (query.status === "ACTIVE") {
    where.isActive = true;
  } else if (query.status === "BLOCKED") {
    where.isActive = false;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.role) {
    where.userRoles = {
      some: {
        role: {
          name: query.role,
        },
      },
    };
  }

  const skip = (query.page - 1) * query.limit;

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: USER_LIST_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
  ]);

  return {
    data: users.map(mapListItem),
    pagination: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function getUserById(
  userId: string,
  actor: AuthenticatedUser,
): Promise<UserDetails> {
  assertCanReadUsers(actor);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...USER_LIST_SELECT,
      isOnline: true,
      agentProfile: {
        select: {
          status: true,
          activeChatCount: true,
          totalChatCount: true,
          averageRating: true,
          totalReviews: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  const details: UserDetails = {
    ...mapListItem(user),
    isOnline: user.isOnline,
    agentProfile: user.agentProfile
      ? {
          status: user.agentProfile.status,
          activeChatCount: user.agentProfile.activeChatCount,
          totalChatCount: user.agentProfile.totalChatCount,
          averageRating: user.agentProfile.averageRating?.toString() ?? null,
          totalReviews: user.agentProfile.totalReviews,
        }
      : null,
  };

  if (hasPermission(actor, "user.read") || hasPermission(actor, "users.view")) {
    const permissions = await prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: { userId },
              },
            },
          },
        },
      },
      select: { name: true },
    });
    details.permissions = permissions.map((item) => item.name);
  }

  return details;
}

export async function updateUserPassword(
  userId: string,
  newPassword: string,
  context: ServiceContext & { currentPassword?: string },
) {
  assertCanChangePassword(context.actor, userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw ApiError.notFound("User not found.");
  }

  const isSelf = context.actor.id === userId;

  if (isSelf) {
    if (!context.currentPassword) {
      throw ApiError.badRequest("Current password is required.");
    }
    const valid = await verifyPassword(
      context.currentPassword,
      user.passwordHash,
    );
    if (!valid) {
      throw ApiError.unauthorized("Current password is incorrect.");
    }
  } else {
    assertCanUpdateUser(context.actor);
    if (!hasPermission(context.actor, "user.password.update")) {
      throw ApiError.forbidden();
    }
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await invalidateUserSessions(userId);

  await createAuditLog(
    isSelf ? AUDIT_ACTIONS.PASSWORD_CHANGED : AUDIT_ACTIONS.PASSWORD_RESET,
    "user",
    userId,
    {
      actorId: context.actor.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  );

  return { success: true };
}

export async function updateUserRole(
  userId: string,
  input: UpdateRoleSchema,
  context: ServiceContext,
) {
  assertCanChangeRole(context.actor);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: { include: { role: true } },
      agentProfile: true,
    },
  });

  if (!user || user.userType !== "STAFF") {
    throw ApiError.notFound("Staff user not found.");
  }

  const role = await assertAssignableRole(context.actor, input.role);
  const previousRole = user.userRoles[0]?.role.name ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } });
    await tx.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });

    if (input.role === "AGENT" && !user.agentProfile) {
      await tx.agentProfile.create({
        data: {
          userId,
          status: "OFFLINE",
          activeChatCount: 0,
          totalChatCount: 0,
        },
      });
    }
  });

  await createAuditLog(
    previousRole ? AUDIT_ACTIONS.ROLE_CHANGED : AUDIT_ACTIONS.ROLE_ASSIGNED,
    "user",
    userId,
    {
      actorId: context.actor.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
    sanitizeAuditData({ role: previousRole }),
    sanitizeAuditData({ role: input.role }),
  );

  return getUserById(userId, context.actor);
}

export async function updateUserStatus(
  userId: string,
  input: UpdateUserStatusInput,
  context: ServiceContext,
) {
  assertCanBlockUser(context.actor);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { agentProfile: true },
  });

  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  if (user.id === context.actor.id && !input.isActive) {
    throw ApiError.badRequest("You cannot block your own account.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        isActive: input.isActive,
        ...(input.isActive ? {} : { isOnline: false }),
      },
    });

    if (user.agentProfile && !input.isActive) {
      await tx.agentProfile.update({
        where: { userId },
        data: {
          status: "OFFLINE",
          lastStatusChangedAt: new Date(),
        },
      });

      await tx.agentStatusHistory.updateMany({
        where: { agentId: userId, endedAt: null },
        data: { endedAt: new Date() },
      });

      await tx.agentStatusHistory.create({
        data: {
          agentId: userId,
          status: "OFFLINE",
          startedAt: new Date(),
        },
      });
    }
  });

  if (!input.isActive) {
    await invalidateUserSessions(userId);
  }

  await createAuditLog(
    input.isActive ? AUDIT_ACTIONS.USER_ACTIVATED : AUDIT_ACTIONS.USER_BLOCKED,
    "user",
    userId,
    {
      actorId: context.actor.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
    sanitizeAuditData({ isActive: user.isActive }),
    sanitizeAuditData({ isActive: input.isActive }),
  );

  return getUserById(userId, context.actor);
}

export async function deleteUser(userId: string, context: ServiceContext) {
  requireAdmin(context.actor);

  if (context.actor.id === userId) {
    throw ApiError.badRequest("You cannot delete your own account.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      userType: true,
    },
  });

  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  const [assignmentCount, sessionCount, messageCount] = await Promise.all([
    prisma.chatAssignment.count({ where: { agentId: userId } }),
    prisma.chatSession.count({
      where: {
        OR: [{ customerId: userId }, { currentAgentId: userId }],
      },
    }),
    prisma.chatMessage.count({ where: { senderId: userId } }),
  ]);

  if (assignmentCount + sessionCount + messageCount > 0) {
    throw ApiError.conflict(
      "User has chat history and cannot be deleted. Block the user instead.",
    );
  }

  await invalidateUserSessions(userId);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.authSession.deleteMany({ where: { userId } });
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.agentStatusHistory.deleteMany({ where: { agentId: userId } });
      await tx.agentProfile.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  } catch {
    throw ApiError.conflict(
      "Unable to delete user due to existing related records.",
    );
  }

  await createAuditLog(
    AUDIT_ACTIONS.USER_DELETED,
    "user",
    userId,
    {
      actorId: context.actor.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
    sanitizeAuditData({
      name: user.name,
      email: user.email,
      userType: user.userType,
    }),
    undefined,
  );

  return { deleted: true };
}

type UpdateUserStatusInput = UpdateUserStatusSchema;

export { canManageUsers };
