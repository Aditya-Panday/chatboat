import type {
  HostToWidgetMessage,
  WebsiteContext,
  WidgetToHostMessage,
} from "@/lib/types";
import type {
  WidgetEventName,
  WidgetEventPayloads,
} from "@/lib/widget-protocol";
import { createWidgetEvent } from "@/lib/widget-protocol";

export const HOST_SOURCE = "coversall-chat-host";
export const WIDGET_SOURCE = "coversall-chat";

let trustedParentOrigin: string | null = null;

export function setTrustedParentOrigin(origin: string) {
  trustedParentOrigin = origin;
}

export function isHostMessage(
  event: MessageEvent,
  data: unknown,
): data is HostToWidgetMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as { source?: unknown; type?: unknown };
  if (message.source !== HOST_SOURCE || typeof message.type !== "string") {
    return false;
  }

  if (trustedParentOrigin && event.origin !== trustedParentOrigin) {
    return false;
  }

  return true;
}

export function postToHost(message: WidgetToHostMessage) {
  if (typeof window === "undefined") return;
  if (window.parent === window) return;
  const targetOrigin = trustedParentOrigin || "*";
  window.parent.postMessage(message, targetOrigin);
}

export function emitWidgetEvent<T extends WidgetEventName>(
  name: T,
  data: WidgetEventPayloads[T],
) {
  postToHost(createWidgetEvent(name, data));
}

export function requestFreshContext(
  timeoutMs = 500,
): Promise<Partial<WebsiteContext> | null> {
  if (typeof window === "undefined" || window.parent === window) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (!isHostMessage(event, event.data)) return;
      if (event.data.type === "setContext") {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(event.data.payload);
      }
    }

    window.addEventListener("message", onMessage);
    postToHost({ source: "coversall-chat", type: "requestContext" });
  });
}
