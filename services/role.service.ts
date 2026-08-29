import { ApiError } from "@/lib/api/response";
import {
  ASSIGNABLE_STAFF_ROLES,
  PRIVILEGED_ROLE_ASSIGNMENTS,
  type AssignableStaffRole,
} from "@/lib/auth/constants";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db";

export async function getRoleByName(roleName: string) {
  return prisma.role.findUnique({
    where: { name: roleName },
  });
}

export async function assertAssignableRole(
  actor: AuthenticatedUser,
  roleName: string,
) {
  if (
    !ASSIGNABLE_STAFF_ROLES.includes(roleName as AssignableStaffRole)
  ) {
    throw ApiError.badRequest("Invalid role.");
  }

  const role = await getRoleByName(roleName);
  if (!role) {
    throw ApiError.badRequest("Role does not exist.");
  }

  const requiredPermission =
    PRIVILEGED_ROLE_ASSIGNMENTS[roleName as AssignableStaffRole];

  if (
    requiredPermission &&
    !actor.permissions.includes(requiredPermission) &&
    !actor.permissions.includes("user.role.update")
  ) {
    throw ApiError.forbidden(
      "You do not have permission to assign this role.",
    );
  }

  return role;
}

export async function listAssignableRoles(actor: AuthenticatedUser) {
  const roles = await prisma.role.findMany({
    where: {
      name: {
        in: [...ASSIGNABLE_STAFF_ROLES],
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return roles.filter((role) => {
    const requiredPermission =
      PRIVILEGED_ROLE_ASSIGNMENTS[role.name as AssignableStaffRole];

    if (!requiredPermission) return true;
    return (
      actor.permissions.includes(requiredPermission) ||
      actor.permissions.includes("user.role.update") ||
      actor.permissions.includes("user.create")
    );
  });
}
