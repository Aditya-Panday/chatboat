import type { ChatMessage, ChatSession, SenderType } from "@prisma/client";

export type SafeChatMessage = {
  id: string;
  sessionId: string;
  senderType: SenderType;
  senderId: string | null;
  content: string | null;
  metadata: unknown;
  createdAt: Date;
};

export type SafeChatSession = {
  id: string;
  publicId: string;
  customerId: string | null;
  status: ChatSession["status"];
  subject: string | null;
  closeReason: string | null;
  currentAgentId: string | null;
  startedAt: Date;
  assignedAt: Date | null;
  closedAt: Date | null;
  lastMessageAt: Date | null;
  customer?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  currentAgent?: {
    id: string;
    name: string;
  } | null;
};

export type SessionWithMessages = SafeChatSession & {
  messages: SafeChatMessage[];
};

export function toSafeMessage(message: ChatMessage): SafeChatMessage {
  return {
    id: message.id,
    sessionId: message.sessionId,
    senderType: message.senderType,
    senderId: message.senderId,
    content: message.content,
    metadata: message.metadata,
    createdAt: message.createdAt,
  };
}

export function toSafeSession(
  session: ChatSession & {
    customer?: { id: string; name: string; email: string | null } | null;
    currentAgent?: { id: string; name: string } | null;
  },
): SafeChatSession {
  return {
    id: session.id,
    publicId: session.publicId,
    customerId: session.customerId,
    status: session.status,
    subject: session.subject,
    closeReason: session.closeReason,
    currentAgentId: session.currentAgentId,
    startedAt: session.startedAt,
    assignedAt: session.assignedAt,
    closedAt: session.closedAt,
    lastMessageAt: session.lastMessageAt,
    customer: session.customer ?? null,
    currentAgent: session.currentAgent ?? null,
  };
}
