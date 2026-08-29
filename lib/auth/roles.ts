import type { AuthenticatedUser } from "@/lib/auth/types";

export function hasRole(user: AuthenticatedUser, roleName: string): boolean {
  return user.roles.some((role) => role.name === roleName);
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, "ADMIN");
}
