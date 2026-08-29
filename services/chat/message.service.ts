import type { SenderType, Prisma } from "@prisma/client";
import { SENDER_TYPE } from "@/lib/chat/domain";
import { toSafeMessage } from "@/lib/chat/types";
import { prisma } from "@/lib/db";
import { assertSessionWritable } from "@/services/chat/session.service";
import { publishRealtimeEvent } from "@/lib/realtime/pubsub";

type CreateMessageInput = {
  sessionId: string;
  senderType: SenderType;
  senderId?: string | null;
  content: string;
  metadata?: Record<string, unknown>;
};

export async function createMessage(input: CreateMessageInput) {
  await assertSessionWritable(input.sessionId);

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        sessionId: input.sessionId,
        senderType: input.senderType,
        senderId: input.senderId ?? null,
        content: input.content,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        messageType: "TEXT",
      },
    });

    await tx.chatSession.update({
      where: { id: input.sessionId },
      data: { lastMessageAt: new Date() },
    });

    return created;
  });

  const safe = toSafeMessage(message);

  publishRealtimeEvent({
    type: "message.created",
    sessionId: input.sessionId,
    payload: safe,
  });

  return safe;
}

export async function createSystemMessage(
  sessionId: string,
  content: string,
  metadata?: Record<string, unknown>,
) {
  return createMessage({
    sessionId,
    senderType: SENDER_TYPE.SYSTEM,
    content,
    metadata,
  });
}

export async function listSessionMessages(sessionId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map(toSafeMessage);
}
