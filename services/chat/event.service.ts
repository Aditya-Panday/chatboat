import type { ActorType, SenderType, SessionEventType } from "@prisma/client";
import { SESSION_EVENT } from "@/lib/chat/domain";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type RecordEventInput = {
  sessionId: string;
  eventType: SessionEventType;
  actorType: ActorType;
  actorId?: string;
  metadata?: Record<string, unknown>;
};

export async function recordSessionEvent(input: RecordEventInput) {
  return prisma.chatSessionEvent.create({
    data: {
      sessionId: input.sessionId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export { SESSION_EVENT };
