import type { ChatCompletionMessage } from "@/lib/ai/prompt";

const DEFAULT_ENDPOINT =
  "https://dev.opencode.ai/inference/openai/v1/chat/completions";
const DEFAULT_MODEL = "big-pickle";
const DEFAULT_USER_AGENT = "opencode/1.18.16";
const FREE_FALLBACK_MODELS = [
  "big-pickle",
  "mimo-v2.5-free",
  "hy3-free",
  "nemotron-3.5-lightning-free",
  "deepseek-v4-flash-free",
];
const REQUEST_TIMEOUT_MS = 25_000;
const RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_DELAY_MS = 3000;

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
  }>;
  error?: {
    type?: string;
    message?: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEndpoint() {
  return process.env.OPENCODE_API_URL?.trim() || DEFAULT_ENDPOINT;
}

function getModels() {
  const configured = process.env.OPENCODE_MODEL?.trim() || DEFAULT_MODEL;
  return [
    configured,
    ...FREE_FALLBACK_MODELS.filter((model) => model !== configured),
  ].filter((model, index, list) => list.indexOf(model) === index);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("rate-limited") ||
    lower.includes("freeusagelimit") ||
    lower.includes("too many requests") ||
    lower.includes("429")
  );
}

function isModelUnavailableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("model is unavailable") ||
    lower.includes("not found") ||
    lower.includes("no longer available") ||
    lower.includes("not supported")
  );
}

function extractAssistantText(response: OpenAIChatResponse): string {
  const message = response.choices?.[0]?.message;
  const content = message?.content?.trim();
  if (content) return content;

  const reasoning = message?.reasoning_content?.trim();
  if (reasoning) return reasoning;

  return "";
}

function parseApiError(body: OpenAIChatResponse, status: number): string {
  const apiMessage =
    body.error?.message ||
    (typeof body.error === "string" ? body.error : "") ||
    `OpenCode request failed with status ${status}`;
  return apiMessage;
}

async function callOpenCodeOnce(
  model: string,
  messages: ChatCompletionMessage[],
  signal: AbortSignal,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent":
      process.env.OPENCODE_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
  };

  const apiKey = process.env.OPENCODE_API_KEY?.trim();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 512,
    }),
    signal,
  });

  let body: OpenAIChatResponse = {};
  try {
    body = (await response.json()) as OpenAIChatResponse;
  } catch {
    throw new Error(
      `OpenCode returned a non-JSON response (${response.status}).`,
    );
  }

  if (!response.ok) {
    throw new Error(parseApiError(body, response.status));
  }

  const text = extractAssistantText(body);
  if (!text) {
    throw new Error("OpenCode returned an empty assistant response.");
  }

  return text;
}

export async function generateOpenCodeReply(
  messages: ChatCompletionMessage[],
): Promise<string> {
  const models = getModels();
  let lastError = "OpenCode request failed";

  for (const model of models) {
    for (let attempt = 0; attempt <= RATE_LIMIT_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const text = await callOpenCodeOnce(model, messages, controller.signal);
        return text;
      } catch (error) {
        lastError = getErrorMessage(error);

        if (lastError.toLowerCase().includes("aborted")) {
          lastError = "OpenCode request timed out.";
        }

        console.error(
          `[opencode] model=${model} attempt=${attempt + 1} error:`,
          lastError,
        );

        if (isRateLimitError(lastError) && attempt < RATE_LIMIT_RETRIES) {
          await sleep(RATE_LIMIT_DELAY_MS * (attempt + 1));
          continue;
        }

        if (isRateLimitError(lastError)) {
          throw new Error("OPENCODE_RATE_LIMIT");
        }

        if (!isModelUnavailableError(lastError)) {
          throw new Error(lastError);
        }

        break;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  throw new Error(lastError);
}
