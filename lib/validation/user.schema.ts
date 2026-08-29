import { z } from "zod";
import { ASSIGNABLE_STAFF_ROLES } from "@/lib/auth/constants";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: passwordSchema,
  role: z.enum(ASSIGNABLE_STAFF_ROLES).optional(),
  userType: z.enum(["CUSTOMER", "STAFF"]).optional(),
});

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  userType: z.enum(["CUSTOMER", "STAFF"]).optional(),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.currentPassword && !value.newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "New password is required.",
        path: ["newPassword"],
      });
    }
  });

export const adminResetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export const updateRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_STAFF_ROLES),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type ListUsersSchema = z.infer<typeof listUsersSchema>;
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
export type UpdateRoleSchema = z.infer<typeof updateRoleSchema>;
export type UpdateUserStatusSchema = z.infer<typeof updateUserStatusSchema>;
