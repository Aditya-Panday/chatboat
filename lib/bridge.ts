import type { HostToWidgetMessage, WebsiteContext, WidgetToHostMessage } from "@/lib/types";

export const HOST_SOURCE = "coversall-chat-host";
export const WIDGET_SOURCE = "coversall-chat";

export function isHostMessage(data: unknown): data is HostToWidgetMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as { source?: unknown; type?: unknown };
  return message.source === HOST_SOURCE && typeof message.type === "string";
}

export function postToHost(message: WidgetToHostMessage) {
  if (typeof window === "undefined") return;
  if (window.parent === window) return;
  window.parent.postMessage(message, "*");
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
      if (!isHostMessage(event.data)) return;
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
