export const AUTH_COOKIE_NAME = "auth_token";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const BCRYPT_ROUNDS = 12;

export const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export const STAFF_USER_TYPES = ["STAFF"] as const;

export const ASSIGNABLE_STAFF_ROLES = ["AGENT", "SUPERVISOR", "ADMIN"] as const;

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

export const PRIVILEGED_ROLE_ASSIGNMENTS: Record<
  AssignableStaffRole,
  string | null
> = {
  AGENT: "user.create",
  SUPERVISOR: "user.role.update",
  ADMIN: "user.role.update",
};

export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_BLOCKED: "USER_BLOCKED",
  USER_ACTIVATED: "USER_ACTIVATED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_RESET: "PASSWORD_RESET",
  ROLE_ASSIGNED: "ROLE_ASSIGNED",
  ROLE_CHANGED: "ROLE_CHANGED",
  USER_DELETED: "USER_DELETED",
} as const;
