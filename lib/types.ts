import type { ChatLifecycle, WidgetEventMessage } from "@/lib/widget-protocol";

export type PageType =
  | "HOME"
  | "PDP"
  | "COLLECTION"
  | "CART"
  | "CHECKOUT"
  | "ACCOUNT"
  | "FAQ"
  | "OTHER";

export type PageSignals = {
  heading?: string;
  description?: string;
  price?: string;
  breadcrumbs?: string;
  cartItems?: string;
  canonicalUrl?: string;
  ogType?: string;
};

export type WebsiteContext = {
  pageType: PageType;
  url: string;
  title: string;
  productId?: string;
  productName?: string;
  website?: string;
  pageSummary?: string;
  pageSignals?: PageSignals;
  actions: ActivityEvent[];
};

export type ActivityEvent = {
  event: string;
  data?: Record<string, unknown>;
  at: string;
};

export type MessageRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  suggestAgent?: boolean;
};

export type HandoffStatus = "idle" | "requested";

export type ChatRequestBody = {
  message: string;
  history: Array<{
    role: MessageRole;
    content: string;
  }>;
  context: Omit<WebsiteContext, "actions">;
  activitySummary: string;
  visitorId: string;
};

export type ChatResponseBody = {
  text: string;
  suggestAgent: boolean;
};

export type WidgetView = "welcome" | "chat";

export type HostViewport = {
  width: number;
  height: number;
  isMobile: boolean;
};

export type HostToWidgetMessage =
  | {
      source: "coversall-chat-host";
      type: "init";
      payload: {
        visitorId: string;
        context: WebsiteContext;
        website: string;
        viewport: HostViewport;
        parentOrigin: string;
      };
    }
  | {
      source: "coversall-chat-host";
      type: "setContext";
      payload: Partial<WebsiteContext>;
    }
  | {
      source: "coversall-chat-host";
      type: "viewport";
      payload: HostViewport;
    }
  | {
      source: "coversall-chat-host";
      type: "track";
      payload: {
        event: string;
        data?: Record<string, unknown>;
      };
    }
  | {
      source: "coversall-chat-host";
      type: "open";
    }
  | {
      source: "coversall-chat-host";
      type: "close";
    }
  | {
      source: "coversall-chat-host";
      type: "WIDGET_INITIATE_CHAT";
    }
  | {
      source: "coversall-chat-host";
      type: "WIDGET_CLOSE_CHAT";
    }
  | {
      source: "coversall-chat-host";
      type: "WIDGET_HIDE_CHAT";
    }
  | {
      source: "coversall-chat-host";
      type: "WIDGET_SHOW_CHAT";
    }
  | {
      source: "coversall-chat-host";
      type: "WIDGET_END_CHAT";
    };

export type WidgetToHostMessage =
  | {
      source: "coversall-chat";
      type: "ready";
    }
  | {
      source: "coversall-chat";
      type: "state";
      payload: {
        open: boolean;
        lifecycle: ChatLifecycle;
      };
    }
  | {
      source: "coversall-chat";
      type: "requestContext";
    }
  | WidgetEventMessage;
