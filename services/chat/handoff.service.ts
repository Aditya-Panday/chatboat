import { NOTIFICATION_TYPE, SESSION_EVENT, SESSION_STATUS } from "@/lib/chat/domain";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { recordSessionEvent } from "@/services/chat/event.service";
import { createSystemMessage } from "@/services/chat/message.service";
import { createNotificationForAdmins } from "@/services/chat/notification.service";
import { tryAutoAssignSession } from "@/services/chat/assignment.service";
import { assertSessionWritable } from "@/services/chat/session.service";
import { publishRealtimeEvent } from "@/lib/realtime/pubsub";

export async function requestAgentHandoff(sessionId: string, customerId?: string) {
  await assertSessionWritable(sessionId);

  const updated = await prisma.$transaction(async (tx) => {
    const session = await tx.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, customerId: true },
    });

    if (!session) throw ApiError.notFound("Conversation not found.");
    if (session.status === SESSION_STATUS.WAITING_FOR_AGENT) {
      return session;
    }

    return tx.chatSession.update({
      where: { id: sessionId },
      data: {
        status: SESSION_STATUS.WAITING_FOR_AGENT,
        agentRequestedAt: new Date(),
      },
      select: { id: true, status: true, customerId: true },
    });
  });

  await recordSessionEvent({
    sessionId,
    eventType: SESSION_EVENT.AGENT_REQUESTED,
    actorType: "CUSTOMER",
    actorId: customerId,
    metadata: { reason: "CUSTOMER_REQUESTED_AGENT" },
  });

  await createSystemMessage(sessionId, "Connecting you with a support agent…");

  await createNotificationForAdmins({
    type: NOTIFICATION_TYPE.CUSTOMER_REQUESTED_AGENT,
    title: "Customer requested an agent",
    message: "A customer requested to speak with a human agent.",
    sessionId,
  });

  publishRealtimeEvent({
    type: "conversation.updated",
    sessionId,
    payload: { status: updated.status },
  });

  const assignment = await tryAutoAssignSession(sessionId);

  return { status: updated.status, assignment };
}
