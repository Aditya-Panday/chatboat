export {};

declare global {
  interface Window {
    widget?: {
      initiateChat: () => Window["widget"];
      closeChat: () => Window["widget"];
      hideChat: () => Window["widget"];
      showChat: () => Window["widget"];
      endChat: () => Window["widget"];
      isOpen: () => boolean;
      on: (
        eventName:
          | "widget_ready"
          | "widget_opened"
          | "widget_closed"
          | "chat_started"
          | "chat_ended"
          | "agent_requested",
        callback: (data: Record<string, unknown>) => void,
      ) => Window["widget"];
      off: (
        eventName:
          | "widget_ready"
          | "widget_opened"
          | "widget_closed"
          | "chat_started"
          | "chat_ended"
          | "agent_requested",
        callback: (data: Record<string, unknown>) => void,
      ) => Window["widget"];
      setContext: (partial: {
        pageType?: string;
        url?: string;
        title?: string;
        productId?: string;
        productName?: string;
        website?: string;
        pageSummary?: string;
        pageSignals?: Record<string, string | undefined>;
      }) => Window["widget"];
      track: (event: {
        event: string;
        data?: Record<string, unknown>;
      }) => Window["widget"];
    };
    CoversAllChat?: {
      open: () => void;
      close: () => void;
      setContext: Window["widget"] extends infer W
        ? W extends { setContext: infer S }
          ? S
          : never
        : never;
      track: Window["widget"] extends infer W
        ? W extends { track: infer T }
          ? T
          : never
        : never;
    };
  }
}
