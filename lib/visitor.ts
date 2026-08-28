export const VISITOR_STORAGE_KEY = "coversall_visitor_id";

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
