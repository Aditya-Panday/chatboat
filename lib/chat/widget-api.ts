import type { SessionWithMessages } from "@/lib/chat/types";
import type { SafeChatMessage } from "@/lib/chat/types";

type ApiSuccess<T> = { success: true; data: T };

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json()) as ApiSuccess<T> | { success: false; error: { message: string } };
  if (!json.success) {
    throw new Error("error" in json ? json.error.message : "Request failed");
  }
  return json.data;
}

export async function startWidgetSession(input: {
  visitorId?: string;
  guest?: { name: string; email: string };
  customerId?: string;
}) {
  const response = await fetch("/api/widget/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseResponse<{
    session: SessionWithMessages;
    created: boolean;
  }>(response);
}

export async function fetchWidgetSession() {
  const response = await fetch("/api/widget/session", {
    credentials: "include",
  });

  return parseResponse<{ session: SessionWithMessages | null }>(response);
}

export async function sendWidgetMessage(content: string) {
  const response = await fetch("/api/widget/session/messages", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  return parseResponse<SafeChatMessage>(response);
}

export async function requestWidgetHandoff() {
  const response = await fetch("/api/widget/session/handoff", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "CUSTOMER_REQUESTED_AGENT" }),
  });

  return parseResponse<{ status: string }>(response);
}

export async function closeWidgetSession(reason: "AI_RESOLVED" | "CUSTOMER_CLOSED" = "CUSTOMER_CLOSED") {
  const response = await fetch("/api/widget/session/close", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  return parseResponse<unknown>(response);
}

export function mapServerMessageToUi(message: SafeChatMessage & { createdAt?: string | Date }) {
  const role =
    message.senderType === "CUSTOMER"
      ? ("user" as const)
      : ("assistant" as const);

  const createdAt =
    message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : String(message.createdAt ?? new Date().toISOString());

  return {
    id: message.id,
    role,
    content: message.content ?? "",
    createdAt,
    senderType: message.senderType,
  };
}
