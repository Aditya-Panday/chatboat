export type RealtimeEventType =
  | "conversation.created"
  | "conversation.updated"
  | "conversation.assigned"
  | "conversation.reassigned"
  | "conversation.resolved"
  | "conversation.closed"
  | "message.created"
  | "notification.created"
  | "notification.read"
  | "agent.status_changed";

export type RealtimeEvent<T = unknown> = {
  type: RealtimeEventType;
  sessionId?: string;
  userId?: string;
  payload: T;
  timestamp: string;
};

export type RealtimeSubscriber = (event: RealtimeEvent) => void;
