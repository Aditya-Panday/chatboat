import type {
  ChatSessionStatus,
  SenderType,
  SessionEventType,
} from "@prisma/client";

/** Maps product language to existing Prisma enum values. */
export const SESSION_STATUS = {
  AI: "AI",
  WAITING_FOR_AGENT: "WAITING_FOR_AGENT",
  ASSIGNED: "ASSIGNED",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const satisfies Record<string, ChatSessionStatus>;

export type DomainSessionStatus = ChatSessionStatus;

export const SENDER_TYPE = {
  CUSTOMER: "CUSTOMER",
  AGENT: "AGENT",
  AI: "AI",
  SYSTEM: "SYSTEM",
} as const satisfies Record<string, SenderType>;

export const CLOSE_REASON = {
  AI_RESOLVED: "AI_RESOLVED",
  CUSTOMER_CLOSED: "CUSTOMER_CLOSED",
  AGENT_RESOLVED: "AGENT_RESOLVED",
  ADMIN_CLOSED: "ADMIN_CLOSED",
} as const;

export const HANDOFF_REASON = {
  CUSTOMER_REQUESTED_AGENT: "CUSTOMER_REQUESTED_AGENT",
} as const;

export const NOTIFICATION_TYPE = {
  CHAT_ASSIGNED: "CHAT_ASSIGNED",
  CHAT_REASSIGNED: "CHAT_REASSIGNED",
  CUSTOMER_MESSAGE: "CUSTOMER_MESSAGE",
  CUSTOMER_REQUESTED_AGENT: "CUSTOMER_REQUESTED_AGENT",
  CHAT_RESOLVED: "CHAT_RESOLVED",
  SYSTEM: "SYSTEM",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const SESSION_EVENT = {
  SESSION_CREATED: "SESSION_CREATED",
  AGENT_REQUESTED: "AGENT_REQUESTED",
  AGENT_ASSIGNED: "AGENT_ASSIGNED",
  AGENT_REASSIGNED: "AGENT_REASSIGNED",
  AGENT_JOINED: "AGENT_JOINED",
  AGENT_CLOSED: "AGENT_CLOSED",
  CUSTOMER_CLOSED: "CUSTOMER_CLOSED",
  SESSION_REOPENED: "SESSION_REOPENED",
  RATING_CREATED: "RATING_CREATED",
} as const satisfies Record<string, SessionEventType>;

export const ACTIVE_SESSION_STATUSES: ChatSessionStatus[] = [
  "AI",
  "WAITING_FOR_AGENT",
  "ASSIGNED",
  "ACTIVE",
];

export const WIDGET_SESSION_COOKIE = "chat_session_token";

export const DEFAULT_SUBJECT = "New Conversation";

export function isSessionWritable(status: ChatSessionStatus): boolean {
  return status !== "CLOSED";
}

/** Only pure AI sessions should call the LLM — not waiting/assigned/active agent chats. */
export function isAiSessionStatus(status: ChatSessionStatus): boolean {
  return status === SESSION_STATUS.AI;
}

export function mapStatusLabel(status: ChatSessionStatus): string {
  switch (status) {
    case "AI":
      return "AI";
    case "WAITING_FOR_AGENT":
      return "Waiting";
    case "ASSIGNED":
      return "Assigned";
    case "ACTIVE":
      return "Active";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}
