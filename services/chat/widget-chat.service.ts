import { cookies } from "next/headers";
import { WIDGET_SESSION_COOKIE } from "@/lib/chat/domain";
import { hashSessionToken } from "@/lib/auth/session-token";
import { SENDER_TYPE } from "@/lib/chat/domain";
import { findSessionByTokenHash } from "@/services/chat/session.service";
import { createMessage } from "@/services/chat/message.service";
import { updateSessionSubject } from "@/services/chat/session.service";

export async function getWidgetSessionFromCookies() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(WIDGET_SESSION_COOKIE)?.value;
  if (!rawToken) return null;

  return findSessionByTokenHash(hashSessionToken(rawToken));
}

export async function persistCustomerMessage(params: {
  sessionId: string;
  customerId: string | null;
  content: string;
}) {
  return createMessage({
    sessionId: params.sessionId,
    senderType: SENDER_TYPE.CUSTOMER,
    senderId: params.customerId,
    content: params.content,
  });
}

export async function persistChatExchange(params: {
  sessionId: string;
  customerId: string | null;
  customerMessage: string;
  aiMessage: string;
}) {
  const customerMessage = await persistCustomerMessage({
    sessionId: params.sessionId,
    customerId: params.customerId,
    content: params.customerMessage,
  });

  const aiMessage = await createMessage({
    sessionId: params.sessionId,
    senderType: SENDER_TYPE.AI,
    content: params.aiMessage,
  });

  if (params.customerMessage.length > 10) {
    const subject = params.customerMessage.slice(0, 80);
    void updateSessionSubject(params.sessionId, subject).catch(() => undefined);
  }

  return { customerMessage, aiMessage };
}

export async function ensureWritableWidgetSession() {
  const session = await getWidgetSessionFromCookies();
  if (!session) return null;
  if (session.status === "CLOSED") return null;
  return session;
}
