import type { QuickActionId } from "@/components/QuickActions";

export type ChatLifecycle = "welcome" | "active" | "agent_requested";

export type ChatFlow = QuickActionId | null;

export type WidgetCommandType =
  | "WIDGET_INITIATE_CHAT"
  | "WIDGET_CLOSE_CHAT"
  | "WIDGET_HIDE_CHAT"
  | "WIDGET_SHOW_CHAT"
  | "WIDGET_END_CHAT";

export type WidgetEventName =
  | "widget_ready"
  | "widget_opened"
  | "widget_closed"
  | "chat_started"
  | "chat_ended"
  | "agent_requested";

export type WidgetEventPayloads = {
  widget_ready: { visitorId: string };
  widget_opened: { timestamp: number };
  widget_closed: { timestamp: number };
  chat_started: {
    source: "user" | "api";
    flow?: "new_order" | "existing_order";
  };
  chat_ended: { timestamp: number };
  agent_requested: { timestamp: number };
};

export type WidgetEventMessage<T extends WidgetEventName = WidgetEventName> = {
  source: "coversall-chat";
  type: "event";
  payload: {
    name: T;
    data: WidgetEventPayloads[T];
  };
};

export function createWidgetEvent<T extends WidgetEventName>(
  name: T,
  data: WidgetEventPayloads[T],
): WidgetEventMessage<T> {
  return {
    source: "coversall-chat",
    type: "event",
    payload: { name, data },
  };
}
