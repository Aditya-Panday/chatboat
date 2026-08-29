export type SafeRole = {
  id: string;
  name: string;
  description: string | null;
};

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string;
  userType: "CUSTOMER" | "STAFF";
  isActive: boolean;
  isOnline: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: SafeRole[];
  permissions: string[];
};

export type AuthSessionRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type UserListItem = {
  id: string;
  name: string;
  email: string | null;
  userType: "CUSTOMER" | "STAFF";
  isActive: boolean;
  roles: SafeRole[];
  createdAt: Date;
  lastSeenAt: Date | null;
};

export type UserDetails = UserListItem & {
  isOnline: boolean;
  permissions?: string[];
  agentProfile?: {
    status: string;
    activeChatCount: number;
    totalChatCount: number;
    averageRating: string | null;
    totalReviews: number;
  } | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: string;
  userType?: "CUSTOMER" | "STAFF";
};

export type UpdatePasswordInput = {
  currentPassword?: string;
  newPassword: string;
};

export type UpdateRoleInput = {
  role: string;
};

export type UpdateUserStatusInput = {
  isActive: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};
