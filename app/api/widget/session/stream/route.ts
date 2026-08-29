import { NextRequest } from "next/server";
import { WIDGET_SESSION_COOKIE } from "@/lib/chat/cookies";
import { hashSessionToken } from "@/lib/auth/session-token";
import { subscribeRealtime } from "@/lib/realtime/pubsub";
import { findSessionByTokenHash } from "@/services/chat/session.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawToken = request.cookies.get(WIDGET_SESSION_COOKIE)?.value;
  if (!rawToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const session = await findSessionByTokenHash(hashSessionToken(rawToken));
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected", sessionId: session.id });

      unsubscribe = subscribeRealtime("session", session.id, (event) => {
        send(event);
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 25000);

      request.signal.addEventListener("abort", () => {
        if (unsubscribe) unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
        controller.close();
      });
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
