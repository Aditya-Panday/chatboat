import { UNKNOWN_REPLY } from "@/lib/knowledge";
import { buildChatMessages, suggestAgent } from "@/lib/ai/prompt";
import { generateOpenCodeReply } from "@/lib/ai/opencode";
import type { ChatRequestBody, ChatResponseBody } from "@/lib/types";

export async function generateChatReply(
  payload: ChatRequestBody,
): Promise<ChatResponseBody> {
  const messages = buildChatMessages(payload);
  const text = (await generateOpenCodeReply(messages)).trim() || UNKNOWN_REPLY;

  return {
    text,
    suggestAgent: suggestAgent(payload.message, text),
  };
}
