import { NextRequest } from "next/server";
import { requireStaff } from "@/lib/auth/authorization";
import {
  subscribeAdminBroadcast,
  subscribeRealtime,
} from "@/lib/realtime/pubsub";
import { isAdmin } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireStaff(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubUser: (() => void) | null = null;
  let unsubBroadcast: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected", userId: user.id });

      unsubUser = subscribeRealtime("user", user.id, (event) => {
        send(event);
      });

      if (isAdmin(user)) {
        unsubBroadcast = subscribeAdminBroadcast((event) => {
          send(event);
        });
      }

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 25000);

      request.signal.addEventListener("abort", () => {
        unsubUser?.();
        unsubBroadcast?.();
        if (heartbeat) clearInterval(heartbeat);
        controller.close();
      });
    },
    cancel() {
      unsubUser?.();
      unsubBroadcast?.();
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
