import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/response";
import { getCurrentUser, getCurrentUserFromRequest } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { isAdmin } from "@/lib/auth/roles";

export async function requireAuth(
  request?: NextRequest,
): Promise<AuthenticatedUser> {
  const user = request
    ? await getCurrentUserFromRequest(request)
    : await getCurrentUser();

  if (!user) {
    throw ApiError.unauthorized();
  }

  return user;
}

export async function requireStaff(
  request?: NextRequest,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  if (user.userType !== "STAFF") {
    throw ApiError.forbidden();
  }

  return user;
}

export function requirePermission(
  user: AuthenticatedUser,
  permission: string,
): AuthenticatedUser {
  if (!user.permissions.includes(permission)) {
    throw ApiError.forbidden();
  }

  return user;
}

export function requireAnyPermission(
  user: AuthenticatedUser,
  permissions: string[],
): AuthenticatedUser {
  const allowed = permissions.some((permission) =>
    user.permissions.includes(permission),
  );

  if (!allowed) {
    throw ApiError.forbidden();
  }

  return user;
}

export function requireRole(
  user: AuthenticatedUser,
  roleName: string,
): AuthenticatedUser {
  const hasRole = user.roles.some((role) => role.name === roleName);
  if (!hasRole) {
    throw ApiError.forbidden();
  }

  return user;
}

export function hasPermission(
  user: AuthenticatedUser,
  permission: string,
): boolean {
  return user.permissions.includes(permission);
}

export function hasAnyPermission(
  user: AuthenticatedUser,
  permissions: string[],
): boolean {
  return permissions.some((permission) =>
    user.permissions.includes(permission),
  );
}

export function requireAdmin(user: AuthenticatedUser): AuthenticatedUser {
  if (!isAdmin(user)) {
    throw ApiError.forbidden("Only administrators can perform this action.");
  }

  return user;
}
