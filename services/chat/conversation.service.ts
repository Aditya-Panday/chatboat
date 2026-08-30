import type { ChatSessionStatus, Prisma } from "@prisma/client";
import {
  CLOSE_REASON,
  SESSION_EVENT,
  SESSION_STATUS,
  mapStatusLabel,
} from "@/lib/chat/domain";
import { toSafeMessage, toSafeSession } from "@/lib/chat/types";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { buildPaginationMeta } from "@/lib/api/response";
import { isAdmin } from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { canStaffAccessConversation } from "@/lib/chat/rbac";
import { recordSessionEvent } from "@/services/chat/event.service";
import { createSystemMessage } from "@/services/chat/message.service";
import { closeSession } from "@/services/chat/session.service";
import { publishRealtimeEvent } from "@/lib/realtime/pubsub";

const SESSION_LIST_INCLUDE = {
  customer: { select: { id: true, name: true, email: true } },
  currentAgent: { select: { id: true, name: true } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} satisfies Prisma.ChatSessionInclude;

export type ConversationFilter =
  | "all"
  | "open"
  | "ai"
  | "waiting"
  | "assigned"
  | "resolved"
  | "closed";

function filterToStatuses(filter: ConversationFilter): ChatSessionStatus[] | null {
  switch (filter) {
    case "ai":
      return ["AI"];
    case "waiting":
      return ["WAITING_FOR_AGENT"];
    case "assigned":
      return ["ASSIGNED", "ACTIVE"];
    case "closed":
      return ["CLOSED"];
    case "resolved":
      return ["CLOSED"];
    case "open":
      return ["AI", "WAITING_FOR_AGENT", "ASSIGNED", "ACTIVE"];
    default:
      return null;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildSearchWhere(search: string): Prisma.ChatSessionWhereInput {
  const clauses: Prisma.ChatSessionWhereInput[] = [
    { subject: { contains: search, mode: "insensitive" } },
    {
      customer: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    },
  ];

  if (isUuid(search)) {
    clauses.push({ id: search }, { publicId: search });
  }

  return { OR: clauses };
}

function buildAccessWhere(user: AuthenticatedUser): Prisma.ChatSessionWhereInput {
  if (isAdmin(user)) return {};

  return {
    OR: [
      { currentAgentId: user.id },
      {
        assignments: {
          some: { agentId: user.id, isCurrent: true },
        },
      },
    ],
  };
}

export async function listConversations(params: {
  user: AuthenticatedUser;
  page?: number;
  limit?: number;
  filter?: ConversationFilter;
  search?: string;
  agentId?: string;
}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const statuses = params.filter ? filterToStatuses(params.filter) : null;

  const access = buildAccessWhere(params.user);
  const filters: Prisma.ChatSessionWhereInput[] = [];

  if (Object.keys(access).length > 0) filters.push(access);
  if (statuses) filters.push({ status: { in: statuses } });
  if (params.agentId) filters.push({ currentAgentId: params.agentId });
  if (params.search) filters.push(buildSearchWhere(params.search));

  const where: Prisma.ChatSessionWhereInput =
    filters.length > 0 ? { AND: filters } : {};

  const [rows, total] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      include: SESSION_LIST_INCLUDE,
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.chatSession.count({ where }),
  ]);

  const data = rows.map((row) => ({
    ...toSafeSession(row),
    preview: row.messages[0]?.content ?? null,
    statusLabel: mapStatusLabel(row.status),
  }));

  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getConversation(
  sessionId: string,
  user: AuthenticatedUser,
) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      currentAgent: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) throw ApiError.notFound("Conversation not found.");

  if (!isAdmin(user)) {
    const assignment = await prisma.chatAssignment.findFirst({
      where: { sessionId, agentId: user.id, isCurrent: true },
      select: { agentId: true },
    });

    const allowed = canStaffAccessConversation(user, {
      currentAgentId: session.currentAgentId,
      assignedAgentIds: assignment ? [assignment.agentId] : [],
    });

    if (!allowed) throw ApiError.forbidden();
  }

  return {
    session: toSafeSession(session),
    messages: session.messages.map(toSafeMessage),
  };
}

export async function resolveConversation(params: {
  sessionId: string;
  agentId: string;
  agentName: string;
}) {
  await createSystemMessage(
    params.sessionId,
    `Chat resolved by ${params.agentName}.`,
  );

  const closed = await closeSession({
    sessionId: params.sessionId,
    closedById: params.agentId,
    closeReason: CLOSE_REASON.AGENT_RESOLVED,
    actorType: "AGENT",
    eventType: SESSION_EVENT.AGENT_CLOSED,
  });

  publishRealtimeEvent({
    type: "conversation.closed",
    sessionId: params.sessionId,
    payload: closed,
  });

  return closed;
}

function startOfCurrentMonth() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
}

export async function getDashboardStats(user: AuthenticatedUser) {
  const access = buildAccessWhere(user);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = startOfCurrentMonth();

  const [
    openChats,
    waiting,
    assigned,
    aiChats,
    closedToday,
    agentsOnline,
    totalChats,
    resolvedChats,
    totalAgents,
    currentMonthChats,
  ] = await Promise.all([
    prisma.chatSession.count({
      where: {
        ...access,
        status: { in: ["AI", "WAITING_FOR_AGENT", "ASSIGNED", "ACTIVE"] },
      },
    }),
    prisma.chatSession.count({
      where: { ...access, status: SESSION_STATUS.WAITING_FOR_AGENT },
    }),
    prisma.chatSession.count({
      where: {
        ...access,
        status: { in: ["ASSIGNED", "ACTIVE"] },
      },
    }),
    prisma.chatSession.count({
      where: { ...access, status: SESSION_STATUS.AI },
    }),
    prisma.chatSession.count({
      where: {
        ...access,
        status: SESSION_STATUS.CLOSED,
        closedAt: { gte: todayStart },
      },
    }),
    isAdmin(user)
      ? prisma.user.count({
          where: {
            userType: "STAFF",
            isActive: true,
            isOnline: true,
            userRoles: { some: { role: { name: "AGENT" } } },
          },
        })
      : Promise.resolve(0),
    prisma.chatSession.count({ where: access }),
    prisma.chatSession.count({
      where: { ...access, status: SESSION_STATUS.CLOSED },
    }),
    isAdmin(user)
      ? prisma.user.count({
          where: {
            userType: "STAFF",
            isActive: true,
            userRoles: { some: { role: { name: "AGENT" } } },
          },
        })
      : Promise.resolve(0),
    prisma.chatSession.count({
      where: { ...access, createdAt: { gte: monthStart } },
    }),
  ]);

  return {
    openChats,
    waiting,
    assigned,
    aiChats,
    closedToday,
    agentsOnline,
    totalChats,
    resolvedChats,
    totalAgents,
    currentMonthChats,
  };
}
