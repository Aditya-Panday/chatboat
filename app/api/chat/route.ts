import { generateChatReply } from "@/lib/ai";
import { inferPageType } from "@/lib/context";
import type {
  ChatRequestBody,
  MessageRole,
  PageSignals,
  PageType,
} from "@/lib/types";

export const maxDuration = 30;

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY = 12;
const MAX_SUMMARY = 1200;

const FRIENDLY_ERROR =
  "I'm sorry, I'm having trouble responding right now. Please try again or chat with an agent.";

function isRole(value: unknown): value is MessageRole {
  return value === "user" || value === "assistant";
}

function isPageType(value: unknown): value is PageType {
  return (
    value === "HOME" ||
    value === "PDP" ||
    value === "COLLECTION" ||
    value === "CART" ||
    value === "CHECKOUT" ||
    value === "ACCOUNT" ||
    value === "FAQ" ||
    value === "OTHER"
  );
}

function parsePageSignals(value: unknown): PageSignals | undefined {
  if (!value || typeof value !== "object") return undefined;
  const input = value as Record<string, unknown>;
  const signals: PageSignals = {};

  for (const key of [
    "heading",
    "description",
    "price",
    "breadcrumbs",
    "cartItems",
    "canonicalUrl",
    "ogType",
  ] as const) {
    if (typeof input[key] === "string" && input[key]) {
      signals[key] = (input[key] as string).slice(0, 500);
    }
  }

  return Object.keys(signals).length > 0 ? signals : undefined;
}

function parseBody(input: unknown): ChatRequestBody | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;

  if (typeof body.message !== "string") return null;
  const message = body.message.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  if (typeof body.visitorId !== "string" || !body.visitorId) return null;
  if (typeof body.activitySummary !== "string") return null;
  if (!body.context || typeof body.context !== "object") return null;

  const context = body.context as Record<string, unknown>;
  const url = typeof context.url === "string" ? context.url : "";
  const pageType = isPageType(context.pageType)
    ? context.pageType
    : inferPageType(url);

  const history = Array.isArray(body.history)
    ? body.history
        .filter((item): item is { role: MessageRole; content: string } => {
          if (!item || typeof item !== "object") return false;
          const entry = item as Record<string, unknown>;
          return isRole(entry.role) && typeof entry.content === "string";
        })
        .slice(-MAX_HISTORY)
        .map((item) => ({
          role: item.role,
          content: item.content.slice(0, MAX_MESSAGE_LENGTH),
        }))
    : [];

  return {
    message,
    visitorId: body.visitorId,
    activitySummary: body.activitySummary.slice(0, 2000),
    history,
    context: {
      pageType,
      url,
      title: typeof context.title === "string" ? context.title : "",
      productId:
        typeof context.productId === "string" ? context.productId : undefined,
      productName:
        typeof context.productName === "string"
          ? context.productName
          : undefined,
      website:
        typeof context.website === "string" ? context.website : undefined,
      pageSummary:
        typeof context.pageSummary === "string"
          ? context.pageSummary.slice(0, MAX_SUMMARY)
          : undefined,
      pageSignals: parsePageSignals(context.pageSignals),
    },
  };
}

export async function POST(request: Request) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = parseBody(json);
  if (!payload) {
    return Response.json(
      { error: "A valid message and visitor session are required." },
      { status: 400 },
    );
  }

  try {
    const result = await generateChatReply(payload);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach the assistant.";

    console.error("[chat/api] OpenCode error:", message);

    if (
      message === "OPENCODE_RATE_LIMIT" ||
      message.toLowerCase().includes("rate limit")
    ) {
      return Response.json(
        {
          error: FRIENDLY_ERROR,
          text: FRIENDLY_ERROR,
          suggestAgent: true,
        },
        { status: 429 },
      );
    }

    if (message.toLowerCase().includes("timed out")) {
      return Response.json(
        {
          error: FRIENDLY_ERROR,
          text: FRIENDLY_ERROR,
          suggestAgent: true,
        },
        { status: 504 },
      );
    }

    return Response.json(
      {
        error:
          process.env.NODE_ENV === "development" ? message : FRIENDLY_ERROR,
        text: FRIENDLY_ERROR,
        suggestAgent: true,
      },
      { status: 502 },
    );
  }
}
