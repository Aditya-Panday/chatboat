import type { AssignmentType } from "@prisma/client";
import { NOTIFICATION_TYPE, SESSION_EVENT, SESSION_STATUS } from "@/lib/chat/domain";
import {
  isAgentEligibleForManualAssignment,
  isDuplicateAssignment,
  shouldAutoAssignWhenNoOnlineAdmins,
} from "@/lib/chat/rbac";
import { toSafeSession } from "@/lib/chat/types";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { recordSessionEvent } from "@/services/chat/event.service";
import { createSystemMessage } from "@/services/chat/message.service";
import { createNotification } from "@/services/chat/notification.service";
import { publishRealtimeEvent } from "@/lib/realtime/pubsub";

type AssignInput = {
  sessionId: string;
  agentId: string;
  assignedById?: string | null;
  assignmentType: AssignmentType;
};

async function findAgentForManualAssign(agentId: string) {
  return prisma.user.findFirst({
    where: {
      id: agentId,
      userType: "STAFF",
      isActive: true,
      userRoles: { some: { role: { name: "AGENT" } } },
    },
    include: {
      agentProfile: true,
      userRoles: { include: { role: true } },
    },
  });
}

async function pickAutoAssignAgent() {
  return prisma.user.findFirst({
    where: {
      userType: "STAFF",
      isActive: true,
      isOnline: true,
      userRoles: { some: { role: { name: "AGENT" } } },
      agentProfile: {
        status: "ONLINE",
      },
    },
    include: { agentProfile: true },
    orderBy: {
      agentProfile: {
        activeChatCount: "asc",
      },
    },
  });
}

export async function assignConversation(input: AssignInput) {
  const agent = await findAgentForManualAssign(input.agentId);
  if (!agent) {
    throw ApiError.badRequest("Selected agent is not available.");
  }

  const eligible = isAgentEligibleForManualAssignment({
    userType: agent.userType,
    isActive: agent.isActive,
    isOnline: agent.isOnline,
    roles: agent.userRoles.map((entry) => entry.role.name),
    agentStatus: agent.agentProfile?.status ?? "OFFLINE",
    activeChatCount: agent.agentProfile?.activeChatCount ?? 0,
    maxConcurrentChats: agent.agentProfile?.maxConcurrentChats ?? 5,
  });

  if (!eligible) {
    throw ApiError.badRequest("Selected agent is not available.");
  }

  const maxChats = agent.agentProfile?.maxConcurrentChats ?? 5;
  const activeChatCount = agent.agentProfile?.activeChatCount ?? 0;
  if (activeChatCount >= maxChats) {
    throw ApiError.conflict("Agent has reached maximum concurrent chats.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.chatSession.findUnique({
      where: { id: input.sessionId },
      select: { id: true, status: true, currentAgentId: true },
    });

    if (!session) throw ApiError.notFound("Conversation not found.");
    if (session.status === SESSION_STATUS.CLOSED) {
      throw ApiError.conflict("Cannot assign a closed conversation.");
    }

    if (
      isDuplicateAssignment({
        currentAgentId: session.currentAgentId,
        targetAgentId: input.agentId,
        status: session.status,
      })
    ) {
      const full = await tx.chatSession.findUniqueOrThrow({
        where: { id: input.sessionId },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          currentAgent: { select: { id: true, name: true } },
        },
      });
      return { session: full, duplicate: true };
    }

    await tx.chatAssignment.updateMany({
      where: { sessionId: input.sessionId, isCurrent: true },
      data: { isCurrent: false, unassignedAt: new Date() },
    });

    if (session.currentAgentId) {
      await tx.agentProfile.update({
        where: { userId: session.currentAgentId },
        data: { activeChatCount: { decrement: 1 } },
      });
    }

    await tx.chatAssignment.create({
      data: {
        sessionId: input.sessionId,
        agentId: input.agentId,
        assignedById: input.assignedById ?? null,
        assignmentType: input.assignmentType,
        isCurrent: true,
      },
    });

    const updated = await tx.chatSession.update({
      where: { id: input.sessionId },
      data: {
        status: SESSION_STATUS.ASSIGNED,
        currentAgentId: input.agentId,
        assignedAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        currentAgent: { select: { id: true, name: true } },
      },
    });

    await tx.agentProfile.update({
      where: { userId: input.agentId },
      data: { activeChatCount: { increment: 1 } },
    });

    return { session: updated, duplicate: false };
  });

  if (!result.duplicate) {
    const eventType =
      input.assignmentType === "REASSIGN"
        ? SESSION_EVENT.AGENT_REASSIGNED
        : SESSION_EVENT.AGENT_ASSIGNED;

    await recordSessionEvent({
      sessionId: input.sessionId,
      eventType,
      actorType: input.assignedById ? "ADMIN" : "SYSTEM",
      actorId: input.assignedById ?? undefined,
      metadata: { agentId: input.agentId, assignmentType: input.assignmentType },
    });

    const agentName = result.session.currentAgent?.name ?? "An agent";
    await createSystemMessage(
      input.sessionId,
      `${agentName} joined the conversation.`,
    );

    await createNotification({
      userId: input.agentId,
      type:
        input.assignmentType === "REASSIGN"
          ? NOTIFICATION_TYPE.CHAT_REASSIGNED
          : NOTIFICATION_TYPE.CHAT_ASSIGNED,
      title: "New conversation assigned",
      message: `You have been assigned a conversation.`,
      sessionId: input.sessionId,
    });

    publishRealtimeEvent({
      type:
        input.assignmentType === "REASSIGN"
          ? "conversation.reassigned"
          : "conversation.assigned",
      sessionId: input.sessionId,
      userId: input.agentId,
      payload: toSafeSession(result.session),
    });
  }

  return toSafeSession(result.session);
}

export async function tryAutoAssignSession(sessionId: string) {
  const onlineAdmins = await prisma.user.count({
    where: {
      isActive: true,
      isOnline: true,
      userRoles: { some: { role: { name: "ADMIN" } } },
    },
  });

  if (!shouldAutoAssignWhenNoOnlineAdmins(onlineAdmins)) {
    return null;
  }

  const agent = await pickAutoAssignAgent();
  if (!agent) return null;

  return assignConversation({
    sessionId,
    agentId: agent.id,
    assignmentType: "AUTO",
  });
}

export async function listAvailableAgents() {
  const agents = await prisma.user.findMany({
    where: {
      userType: "STAFF",
      isActive: true,
      userRoles: { some: { role: { name: "AGENT" } } },
    },
    select: {
      id: true,
      name: true,
      isOnline: true,
      agentProfile: {
        select: {
          status: true,
          activeChatCount: true,
          maxConcurrentChats: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    isOnline: agent.isOnline,
    status: agent.agentProfile?.status ?? "OFFLINE",
    activeChatCount: agent.agentProfile?.activeChatCount ?? 0,
    maxConcurrentChats: agent.agentProfile?.maxConcurrentChats ?? 5,
  }));
}
