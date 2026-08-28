import type { ActivityEvent, PageType, WebsiteContext } from "@/lib/types";

export const MAX_TRACKED_ACTIONS = 12;

export function createEmptyContext(): WebsiteContext {
  return {
    pageType: "OTHER",
    url: "",
    title: "",
    actions: [],
  };
}

export function inferPageType(url: string): PageType {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path === "/" || path === "") return "HOME";
    if (path.includes("/cart")) return "CART";
    if (path.includes("/checkout")) return "CHECKOUT";
    if (path.includes("/account") || path.includes("/orders")) return "ACCOUNT";
    if (path.includes("/faq") || path.includes("/help")) return "FAQ";
    if (
      path.includes("/product") ||
      path.includes("/p/") ||
      path.includes("/pd/") ||
      path.includes("/covers/")
    ) {
      return "PDP";
    }
    if (
      path.includes("/collection") ||
      path.includes("/category") ||
      path.includes("/shop") ||
      path.includes("/custom")
    ) {
      return "COLLECTION";
    }
    return "OTHER";
  } catch {
    return "OTHER";
  }
}

export function mergeContext(
  current: WebsiteContext,
  partial: Partial<WebsiteContext>,
): WebsiteContext {
  return {
    ...current,
    ...partial,
    actions: partial.actions ?? current.actions,
  };
}

export function appendActivity(
  current: WebsiteContext,
  event: string,
  data?: Record<string, unknown>,
): WebsiteContext {
  const nextEvent: ActivityEvent = {
    event,
    data,
    at: new Date().toISOString(),
  };

  return {
    ...current,
    actions: [...current.actions, nextEvent].slice(-MAX_TRACKED_ACTIONS),
  };
}

function compactValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function summarizeActivity(actions: ActivityEvent[]): string {
  if (actions.length === 0) {
    return "No notable visitor activity has been tracked in this session.";
  }

  const lines = actions.slice(-8).map((action) => {
    const details = action.data
      ? Object.entries(action.data)
          .slice(0, 4)
          .map(([key, value]) => `${key}=${compactValue(value)}`)
          .join(", ")
      : "";
    return `- ${action.event}${details ? ` (${details})` : ""}`;
  });

  return lines.join("\n");
}

export function formatPageContext(context: Omit<WebsiteContext, "actions">): string {
  const lines = [
    `pageType: ${context.pageType}`,
    `url: ${context.url || "unknown"}`,
    `title: ${context.title || "unknown"}`,
  ];

  if (context.website) lines.push(`website: ${context.website}`);
  if (context.productId) lines.push(`productId: ${context.productId}`);
  if (context.productName) lines.push(`productName: ${context.productName}`);

  if (context.pageSignals) {
    const signals = context.pageSignals;
    if (signals.heading) lines.push(`heading: ${signals.heading}`);
    if (signals.description) lines.push(`description: ${signals.description}`);
    if (signals.price) lines.push(`price: ${signals.price}`);
    if (signals.breadcrumbs) lines.push(`breadcrumbs: ${signals.breadcrumbs}`);
    if (signals.cartItems) lines.push(`cartItems: ${signals.cartItems}`);
    if (signals.canonicalUrl) lines.push(`canonicalUrl: ${signals.canonicalUrl}`);
    if (signals.ogType) lines.push(`ogType: ${signals.ogType}`);
  }

  if (context.pageSummary) {
    lines.push("", "pageSummary:", context.pageSummary);
  }

  return lines.join("\n");
}

export function toPromptContext(context: WebsiteContext): Omit<
  WebsiteContext,
  "actions"
> {
  return {
    pageType: context.pageType,
    url: context.url,
    title: context.title,
    productId: context.productId,
    productName: context.productName,
    website: context.website,
    pageSummary: context.pageSummary,
    pageSignals: context.pageSignals,
  };
}
