import type { RealtimeEvent, RealtimeSubscriber } from "@/lib/realtime/types";

const globalStore = globalThis as unknown as {
  __chatRealtimeSubscribers?: Map<string, Set<RealtimeSubscriber>>;
};

function getStore() {
  if (!globalStore.__chatRealtimeSubscribers) {
    globalStore.__chatRealtimeSubscribers = new Map();
  }
  return globalStore.__chatRealtimeSubscribers;
}

function channelKey(scope: "session" | "user", id: string) {
  return `${scope}:${id}`;
}

export function subscribeRealtime(
  scope: "session" | "user",
  id: string,
  handler: RealtimeSubscriber,
) {
  const store = getStore();
  const key = channelKey(scope, id);
  const set = store.get(key) ?? new Set<RealtimeSubscriber>();
  set.add(handler);
  store.set(key, set);

  return () => {
    set.delete(handler);
    if (set.size === 0) store.delete(key);
  };
}

export function publishRealtimeEvent(event: Omit<RealtimeEvent, "timestamp">) {
  const enriched: RealtimeEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  const store = getStore();
  const targets = new Set<RealtimeSubscriber>();

  if (event.sessionId) {
    const sessionSet = store.get(channelKey("session", event.sessionId));
    sessionSet?.forEach((handler) => targets.add(handler));
  }

  if (event.userId) {
    const userSet = store.get(channelKey("user", event.userId));
    userSet?.forEach((handler) => targets.add(handler));
  }

  const broadcast = store.get("broadcast:all");
  broadcast?.forEach((handler) => targets.add(handler));

  targets.forEach((handler) => {
    try {
      handler(enriched);
    } catch (error) {
      console.error("[realtime]", error);
    }
  });
}

export function subscribeAdminBroadcast(handler: RealtimeSubscriber) {
  const store = getStore();
  const key = "broadcast:all";
  const set = store.get(key) ?? new Set<RealtimeSubscriber>();
  set.add(handler);
  store.set(key, set);

  return () => {
    set.delete(handler);
    if (set.size === 0) store.delete(key);
  };
}
