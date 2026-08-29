import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type AuditContext = {
  actorId?: string | null;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  context: AuditContext,
  oldData?: Prisma.InputJsonValue,
  newData?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: {
      actorId: context.actorId ?? null,
      action,
      entityType,
      entityId,
      oldData: oldData ?? undefined,
      newData: newData ?? undefined,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  });
}

export function sanitizeAuditData(
  data: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (!data) return undefined;

  const clone = { ...data };
  delete clone.password;
  delete clone.passwordHash;
  delete clone.currentPassword;
  delete clone.newPassword;
  delete clone.token;
  delete clone.refreshToken;
  return clone as Prisma.InputJsonValue;
}
