import {
  generateSessionToken,
  hashSessionToken,
} from "@/lib/auth/session-token";
import {
  ACTIVE_SESSION_STATUSES,
  DEFAULT_SUBJECT,
  SESSION_EVENT,
  SESSION_STATUS,
  WIDGET_SESSION_COOKIE,
} from "@/lib/chat/domain";
import { toSafeMessage, toSafeSession } from "@/lib/chat/types";
import type { SessionWithMessages } from "@/lib/chat/types";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/api/request";
import { ApiError } from "@/lib/api/response";
import { recordSessionEvent } from "@/services/chat/event.service";

const SESSION_INCLUDE = {
  customer: { select: { id: true, name: true, email: true } },
  currentAgent: { select: { id: true, name: true } },
} as const;

export { WIDGET_SESSION_COOKIE, hashSessionToken };

export function buildWidgetSessionCookie(token: string, expiresAt: Date) {
  return {
    name: WIDGET_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  };
}

function sessionExpiry() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

type GuestIdentity = {
  name: string;
  email: string;
};

export function buildVisitorGuestEmail(visitorId: string) {
  return `${visitorId}@guest.coversandall.com`;
}

/** Anonymous widget visitor — one stable guest account per visitorId. */
export async function getOrCreateVisitorCustomer(visitorId: string) {
  const email = normalizeEmail(buildVisitorGuestEmail(visitorId));
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      name: "Guest",
      email,
      userType: "CUSTOMER",
      isActive: true,
    },
  });
}

async function upsertGuestCustomer(identity: GuestIdentity) {
  const email = normalizeEmail(identity.email);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.name !== identity.name.trim()) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { name: identity.name.trim() },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      name: identity.name.trim(),
      email,
      userType: "CUSTOMER",
      isActive: true,
    },
  });
}

export async function findSessionByTokenHash(tokenHash: string) {
  return prisma.chatSession.findUnique({
    where: { sessionTokenHash: tokenHash },
    include: {
      ...SESSION_INCLUDE,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getActiveSessionForCustomer(customerId: string) {
  return prisma.chatSession.findFirst({
    where: {
      customerId,
      status: { in: ACTIVE_SESSION_STATUSES },
    },
    orderBy: { createdAt: "desc" },
    include: {
      ...SESSION_INCLUDE,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

type CreateSessionInput = {
  customerId: string;
  source?: "WEB" | "MOBILE" | "API";
  subject?: string;
};

export async function createChatSession(input: CreateSessionInput) {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.chatSession.create({
      data: {
        sessionTokenHash: tokenHash,
        customer: { connect: { id: input.customerId } },
        status: SESSION_STATUS.AI,
        source: input.source ?? "WEB",
        subject: input.subject ?? DEFAULT_SUBJECT,
        lastMessageAt: new Date(),
      },
      include: SESSION_INCLUDE,
    });

    await tx.chatSessionEvent.create({
      data: {
        session: { connect: { id: created.id } },
        eventType: SESSION_EVENT.SESSION_CREATED,
        actorType: "CUSTOMER",
        actor: { connect: { id: input.customerId } },
      },
    });

    return created;
  });

  return {
    session: toSafeSession(session),
    messages: [] as ReturnType<typeof toSafeMessage>[],
    rawToken,
    expiresAt: sessionExpiry(),
  };
}

type ResumeOrCreateInput = {
  tokenHash?: string;
  visitorId?: string;
  guest?: GuestIdentity;
  customerId?: string;
};

/** Idempotent: resume open session or create a new one. */
export async function resumeOrCreateSession(
  input: ResumeOrCreateInput,
): Promise<{
  session: SessionWithMessages;
  rawToken: string;
  expiresAt: Date;
  created: boolean;
}> {
  if (input.tokenHash) {
    const existing = await findSessionByTokenHash(input.tokenHash);
    if (existing && ACTIVE_SESSION_STATUSES.includes(existing.status)) {
      return {
        session: {
          ...toSafeSession(existing),
          messages: existing.messages.map(toSafeMessage),
        },
        rawToken: "",
        expiresAt: sessionExpiry(),
        created: false,
      };
    }
  }

  let customerId = input.customerId;

  if (!customerId && input.guest) {
    const customer = await upsertGuestCustomer(input.guest);
    customerId = customer.id;
  }

  if (!customerId && input.visitorId) {
    const customer = await getOrCreateVisitorCustomer(input.visitorId);
    customerId = customer.id;
  }

  if (customerId) {
    const active = await getActiveSessionForCustomer(customerId);
    if (active) {
      return {
        session: {
          ...toSafeSession(active),
          messages: active.messages.map(toSafeMessage),
        },
        rawToken: "",
        expiresAt: sessionExpiry(),
        created: false,
      };
    }
  }

  if (!customerId) {
    throw ApiError.badRequest("Customer identity is required to start a chat.");
  }

  const customerExists = await prisma.user.findFirst({
    where: { id: customerId, userType: "CUSTOMER", isActive: true },
    select: { id: true },
  });

  if (!customerExists) {
    throw ApiError.badRequest("Customer account not found.");
  }

  const created = await createChatSession({ customerId });
  return {
    session: { ...created.session, messages: created.messages },
    rawToken: created.rawToken,
    expiresAt: created.expiresAt,
    created: true,
  };
}

export async function closeSession(params: {
  sessionId: string;
  closedById?: string | null;
  closeReason: string;
  actorType: "CUSTOMER" | "AGENT" | "ADMIN" | "AI" | "SYSTEM";
  eventType:
    | typeof SESSION_EVENT.AGENT_CLOSED
    | typeof SESSION_EVENT.CUSTOMER_CLOSED;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.chatSession.findUnique({
      where: { id: params.sessionId },
      select: { id: true, status: true, currentAgentId: true },
    });

    if (!session || session.status === SESSION_STATUS.CLOSED) {
      return { count: 0, currentAgentId: session?.currentAgentId ?? null };
    }

    const updated = await tx.chatSession.update({
      where: { id: params.sessionId },
      data: {
        status: SESSION_STATUS.CLOSED,
        closedAt: new Date(),
        closedById: params.closedById ?? null,
        closeReason: params.closeReason,
      },
    });

    if (session.currentAgentId) {
      await tx.agentProfile.update({
        where: { userId: session.currentAgentId },
        data: { activeChatCount: { decrement: 1 } },
      });

      await tx.chatAssignment.updateMany({
        where: { sessionId: params.sessionId, isCurrent: true },
        data: { isCurrent: false, unassignedAt: new Date() },
      });
    }

    return { count: 1, currentAgentId: session.currentAgentId, updated };
  });

  if (result.count === 0) {
    throw ApiError.conflict("Conversation is already closed.");
  }

  await recordSessionEvent({
    sessionId: params.sessionId,
    eventType: params.eventType,
    actorType: params.actorType,
    actorId: params.closedById ?? undefined,
    metadata: { closeReason: params.closeReason },
  });

  const session = await prisma.chatSession.findUniqueOrThrow({
    where: { id: params.sessionId },
    include: SESSION_INCLUDE,
  });

  return toSafeSession(session);
}

export async function assertSessionWritable(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!session) throw ApiError.notFound("Conversation not found.");
  if (session.status === SESSION_STATUS.CLOSED) {
    throw ApiError.conflict("This conversation is closed.");
  }

  return session;
}

export async function updateSessionSubject(sessionId: string, subject: string) {
  if (!subject.trim()) return;
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { subject: subject.trim().slice(0, 200) },
  });
}
