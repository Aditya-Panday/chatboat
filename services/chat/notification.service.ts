import type { NotificationType } from "@/lib/chat/domain";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime/pubsub";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      sessionId: input.sessionId,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  publishRealtimeEvent({
    type: "notification.created",
    userId: input.userId,
    sessionId: input.sessionId,
    payload: notification,
  });

  return notification;
}

export async function createNotificationForAdmins(
  input: Omit<CreateNotificationInput, "userId">,
) {
  const admins = await prisma.user.findMany({
    where: {
      isActive: true,
      userRoles: { some: { role: { name: "ADMIN" } } },
    },
    select: { id: true },
  });

  return Promise.all(
    admins.map((admin) =>
      createNotification({
        ...input,
        userId: admin.id,
      }),
    ),
  );
}

export async function listNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const updated = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  if (updated.count === 0) return null;

  publishRealtimeEvent({
    type: "notification.read",
    userId,
    payload: { notificationId },
  });

  return { read: true };
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAllNotificationsRead(userId: string) {
  const updated = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  if (updated.count > 0) {
    publishRealtimeEvent({
      type: "notification.read",
      userId,
      payload: { all: true },
    });
  }

  return { read: updated.count };
}
