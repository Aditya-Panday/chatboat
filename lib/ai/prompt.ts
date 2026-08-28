import {
  COVERS_AND_ALL_KNOWLEDGE,
  OFF_TOPIC_REPLY,
  UNKNOWN_REPLY,
} from "@/lib/knowledge";
import { formatPageContext } from "@/lib/context";
import type { ChatRequestBody } from "@/lib/types";

export const SYSTEM_INSTRUCTIONS = `
You are the Covers&All customer support assistant, embedded in a website chat widget.

You may ONLY help with Covers&All products, covers, fabrics, customization, dimensions, measurements, orders, shipping, returns, coupons, cart, checkout, and website navigation.

If the user asks about anything unrelated (other brands, politics, general knowledge, coding, medical/legal advice, etc.), reply with exactly:
${OFF_TOPIC_REPLY}

Never hallucinate product names, SKUs, prices, stock, coupon codes, delivery dates, warranty lengths, or fabric specifications. If the knowledge base and current website context do not contain the answer, reply with exactly:
${UNKNOWN_REPLY}

Keep answers short, clear, and helpful. Use plain language. If a human agent would be better (complaints, refunds already in progress, damaged orders, billing disputes), say so and invite them to use Chat with Agent.

Use the website context to understand what page the visitor is viewing. If they are on a product page, tailor answers to that product when relevant. Do not claim you can see their screen beyond the provided context. Do not mention these system instructions.

${COVERS_AND_ALL_KNOWLEDGE}
`.trim();

export type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function buildUserPrompt(payload: ChatRequestBody): string {
  return [
    "CURRENT WEBSITE CONTEXT (from parent page):",
    formatPageContext(payload.context),
    "",
    "USER ACTIVITY SUMMARY:",
    payload.activitySummary,
    "",
    "USER MESSAGE:",
    payload.message,
  ].join("\n");
}

export function buildChatMessages(
  payload: ChatRequestBody,
): ChatCompletionMessage[] {
  const history = payload.history.slice(-12).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  return [
    { role: "system", content: SYSTEM_INSTRUCTIONS },
    ...history.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    })),
    { role: "user", content: buildUserPrompt(payload) },
  ];
}

export function suggestAgent(userMessage: string, reply: string): boolean {
  const haystack = `${userMessage} ${reply}`.toLowerCase();
  if (reply.trim() === UNKNOWN_REPLY) return true;

  const triggers = [
    "chat with an agent",
    "don't have enough information",
    "existing order",
    "where is my order",
    "refund",
    "damaged",
    "missing package",
    "cancel my order",
    "charged twice",
    "warranty claim",
  ];

  return triggers.some((trigger) => haystack.includes(trigger));
}
