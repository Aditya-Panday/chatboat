"use client";

import { ChatLauncher } from "@/components/ChatLauncher";
import { ChatWindow } from "@/components/ChatWindow";
import { CloseConfirmDialog } from "@/components/CloseConfirmDialog";
import { GuestIdentityForm } from "@/components/GuestIdentityForm";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import {
  emitWidgetEvent,
  isHostMessage,
  postToHost,
  requestFreshContext,
  setTrustedParentOrigin,
} from "@/lib/bridge";
import {
  appendActivity,
  createEmptyContext,
  mergeContext,
  summarizeActivity,
  toPromptContext,
} from "@/lib/context";
import {
  getStoredGuestIdentity,
  storeGuestIdentity,
} from "@/lib/guest-identity";
import { requestAgentHandoff } from "@/lib/handoff";
import type { ChatSessionStatus } from "@prisma/client";
import { isAiSessionStatus } from "@/lib/chat/domain";
import {
  closeWidgetSession,
  fetchWidgetSession,
  mapServerMessageToUi,
  sendWidgetMessage,
  startWidgetSession,
} from "@/lib/chat/widget-api";
import type { ChatFlow, ChatLifecycle } from "@/lib/widget-protocol";
import type {
  ChatMessage,
  HandoffStatus,
  HostToWidgetMessage,
  HostViewport,
  WebsiteContext,
  WidgetView,
} from "@/lib/types";
import type { SafeChatMessage, SessionWithMessages } from "@/lib/chat/types";
import { getOrCreateVisitorId } from "@/lib/visitor";
import type { QuickActionId } from "@/components/QuickActions";
import { useCallback, useEffect, useRef, useState } from "react";

const QUICK_ACTION_MESSAGES: Record<QuickActionId, string> = {
  new_order:
    "I'd like help with a new order — finding the right cover, fabric, or size.",
  existing_order:
    "I need help with an existing Covers&All order (shipping, returns, or changes).",
};

const DEFAULT_VIEWPORT: HostViewport = {
  width: 450,
  height: 650,
  isMobile: false,
};

function createMessage(
  role: ChatMessage["role"],
  content: string,
  options?: {
    id?: string;
    suggestAgent?: boolean;
    suggestResolution?: boolean;
  },
): ChatMessage {
  return {
    id: options?.id ?? crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    suggestAgent: options?.suggestAgent,
    suggestResolution: options?.suggestResolution,
    senderType: role === "user" ? "CUSTOMER" : "AI",
  };
}

function appendUniqueMessage(
  current: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  if (current.some((item) => item.id === message.id)) return current;
  if (
    current.some(
      (item) =>
        item.role === message.role &&
        item.content === message.content &&
        (item.senderType ?? "") === (message.senderType ?? ""),
    )
  ) {
    return current;
  }
  return [...current, message];
}

function handoffStatusFromSession(status: string | null): HandoffStatus {
  if (status === "WAITING_FOR_AGENT") return "requested";
  if (status === "ASSIGNED" || status === "ACTIVE") return "connected";
  return "idle";
}

function isAgentHandledChat(
  sessionStatus: string | null,
  handoffStatus: HandoffStatus,
): boolean {
  if (handoffStatus === "requested" || handoffStatus === "connected") {
    return true;
  }
  if (!sessionStatus) return false;
  return !isAiSessionStatus(sessionStatus as ChatSessionStatus);
}

function resolveLifecycle(
  view: WidgetView,
  handoffStatus: HandoffStatus,
  isSessionClosed: boolean,
): ChatLifecycle {
  if (isSessionClosed) return "welcome";
  if (handoffStatus === "requested") return "agent_requested";
  if (view === "chat") return "active";
  return "welcome";
}

type ChatWidgetProps = {
  initialOpen?: boolean;
  hideLauncherWhenClosed?: boolean;
};

export function ChatWidget({
  initialOpen = false,
  hideLauncherWhenClosed = false,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [view, setView] = useState<WidgetView>("welcome");
  const [chatFlow, setChatFlow] = useState<ChatFlow>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [handoffStatus, setHandoffStatus] = useState<HandoffStatus>("idle");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [viewport, setViewport] = useState<HostViewport>(DEFAULT_VIEWPORT);
  const [visitorId, setVisitorId] = useState("");
  const [context, setContext] = useState<WebsiteContext>(createEmptyContext);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [isSessionClosed, setIsSessionClosed] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [loggedInCustomer, setLoggedInCustomer] = useState<{
    id: string;
    name: string;
    email?: string;
  } | null>(null);
  const [resolutionDismissed, setResolutionDismissed] = useState(false);

  const sendingRef = useRef(false);
  const chatStartedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const loggedInCustomerRef = useRef<typeof loggedInCustomer>(null);

  const lifecycle = resolveLifecycle(view, handoffStatus, isSessionClosed);

  const applySession = useCallback((session: SessionWithMessages) => {
    sessionIdRef.current = session.id;
    setSessionId(session.id);
    setSessionStatus(session.status);
    setIsSessionClosed(session.status === "CLOSED");
    setHandoffStatus(handoffStatusFromSession(session.status));
    setMessages(session.messages.map(mapServerMessageToUi));
    if (session.messages.length > 0) {
      setView("chat");
    }
    setSessionReady(true);
  }, []);

  const bootstrapSession = useCallback(async () => {
    setIsBootstrapping(true);
    try {
      const { session } = await fetchWidgetSession();
      if (session) {
        applySession(session);
        return session;
      }

      const customer = loggedInCustomerRef.current;
      if (customer) {
        setNeedsIdentity(false);
      }

      const stored = getStoredGuestIdentity();
      if (stored) {
        setGuestName(stored.name);
        setGuestEmail(stored.email);
        setNeedsIdentity(false);
      } else {
        setNeedsIdentity(true);
      }

      setSessionReady(true);
      return null;
    } catch {
      setSessionReady(true);
      if (!loggedInCustomerRef.current) {
        setNeedsIdentity(true);
      }
      return null;
    } finally {
      setIsBootstrapping(false);
    }
  }, [applySession, visitorId]);

  useEffect(() => {
    if (!visitorId) return;
    void bootstrapSession();
  }, [visitorId, bootstrapSession]);

  useEffect(() => {
    if (!sessionId || isSessionClosed) return;

    const source = new EventSource("/api/widget/session/stream");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          payload?: SafeChatMessage;
        };

        if (payload.type === "message.created" && payload.payload) {
          const mapped = mapServerMessageToUi(payload.payload);
          setMessages((current) => appendUniqueMessage(current, mapped));
        }

        if (payload.type === "conversation.updated") {
          const status = (payload.payload as { status?: string })?.status;
          if (status) {
            setSessionStatus(status);
            setHandoffStatus(handoffStatusFromSession(status));
          }
        }

        if (payload.type === "conversation.closed") {
          setIsSessionClosed(true);
          setSessionStatus("CLOSED");
        }
      } catch {
        // ignore malformed events
      }
    };

    return () => source.close();
  }, [sessionId, isSessionClosed]);

  const ensureActiveSession = useCallback(async () => {
    if (sessionIdRef.current && !isSessionClosed) {
      return sessionIdRef.current;
    }

    const customer = loggedInCustomerRef.current;
    if (customer) {
      const result = await startWidgetSession({
        visitorId: visitorId || getOrCreateVisitorId(),
        customerId: customer.id,
      });
      applySession(result.session);
      return result.session.id;
    }

    const stored = getStoredGuestIdentity();
    const guest =
      stored ??
      (guestName.trim() && guestEmail.trim()
        ? { name: guestName.trim(), email: guestEmail.trim() }
        : null);

    if (!guest) {
      setNeedsIdentity(true);
      throw new Error("Guest identity required.");
    }

    storeGuestIdentity(guest);
    setNeedsIdentity(false);

    const result = await startWidgetSession({
      visitorId: visitorId || getOrCreateVisitorId(),
      guest,
    });

    applySession(result.session);
    return result.session.id;
  }, [applySession, guestEmail, guestName, isSessionClosed, visitorId]);

  const reportOpenState = useCallback(
    (open: boolean) => {
      postToHost({
        source: "coversall-chat",
        type: "state",
        payload: {
          open,
          lifecycle: resolveLifecycle(view, handoffStatus, isSessionClosed),
        },
      });
    },
    [view, handoffStatus, isSessionClosed],
  );

  const closeChat = useCallback(() => {
    setShowCloseConfirm(false);
    setIsOpen(false);
    emitWidgetEvent("widget_closed", { timestamp: Date.now() });
  }, []);

  const endChat = useCallback(() => {
    setShowCloseConfirm(false);
    setView("welcome");
    setChatFlow(null);
    setDraft("");
    setMessages([]);
    setIsSending(false);
    setError(null);
    setRetryMessage(null);
    setHandoffStatus("idle");
    setSessionId(null);
    setSessionStatus(null);
    setIsSessionClosed(false);
    sessionIdRef.current = null;
    sendingRef.current = false;
    chatStartedRef.current = false;
    emitWidgetEvent("chat_ended", { timestamp: Date.now() });
  }, []);

  const handleStartNewChat = useCallback(() => {
    setMessages([]);
    setIsSessionClosed(false);
    setHandoffStatus("idle");
    setError(null);
    setDraft("");
    setResolutionDismissed(false);
    sessionIdRef.current = null;
    setSessionId(null);
    setSessionStatus(null);
    setView("welcome");
    setNeedsIdentity(!loggedInCustomerRef.current && !getStoredGuestIdentity());
  }, []);

  const initiateChat = useCallback(() => {
    setIsOpen(true);
    emitWidgetEvent("widget_opened", { timestamp: Date.now() });
  }, []);

  const markChatStarted = useCallback(
    (source: "user" | "api", flow?: ChatFlow) => {
      if (chatStartedRef.current) return;
      chatStartedRef.current = true;
      emitWidgetEvent("chat_started", {
        source,
        flow: flow ?? undefined,
      });
    },
    [],
  );

  const handleHostMessage = useCallback(
    (message: HostToWidgetMessage) => {
      switch (message.type) {
        case "init":
          setTrustedParentOrigin(message.payload.parentOrigin);
          setVisitorId(message.payload.visitorId);
          setViewport(message.payload.viewport);
          if (message.payload.customer) {
            loggedInCustomerRef.current = message.payload.customer;
            setLoggedInCustomer(message.payload.customer);
            setNeedsIdentity(false);
          }
          setContext((current) =>
            mergeContext(current, {
              ...message.payload.context,
              website: message.payload.website,
            }),
          );
          break;
        case "viewport":
          setViewport(message.payload);
          break;
        case "setContext":
          setContext((current) => mergeContext(current, message.payload));
          break;
        case "track":
          setContext((current) =>
            appendActivity(
              current,
              message.payload.event,
              message.payload.data,
            ),
          );
          break;
        case "open":
        case "WIDGET_INITIATE_CHAT":
          initiateChat();
          break;
        case "close":
        case "WIDGET_CLOSE_CHAT":
          closeChat();
          break;
        case "WIDGET_HIDE_CHAT":
          setIsOpen(false);
          setShowCloseConfirm(false);
          break;
        case "WIDGET_SHOW_CHAT":
          setIsOpen(true);
          emitWidgetEvent("widget_opened", { timestamp: Date.now() });
          break;
        case "WIDGET_END_CHAT":
          endChat();
          break;
        default:
          break;
      }
    },
    [closeChat, endChat, initiateChat],
  );

  useEffect(() => {
    postToHost({ source: "coversall-chat", type: "ready" });
  }, []);

  useEffect(() => {
    reportOpenState(isOpen);
  }, [isOpen, lifecycle, reportOpenState]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isHostMessage(event, event.data)) return;
      handleHostMessage(event.data);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handleHostMessage]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isOpen) return;
      if (showCloseConfirm) {
        setShowCloseConfirm(false);
        return;
      }
      setShowCloseConfirm(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, showCloseConfirm]);

  const sendMessage = useCallback(
    async (
      text: string,
      options?: {
        retry?: boolean;
        source?: "user" | "api";
        flow?: ChatFlow;
      },
    ) => {
      const content = text.trim();
      if (!content || sendingRef.current || isSessionClosed) return;

      const vid = visitorId || getOrCreateVisitorId();
      if (!visitorId) setVisitorId(vid);

      sendingRef.current = true;
      setIsSending(true);
      setError(null);
      setRetryMessage(content);
      setDraft("");
      setIsOpen(true);
      setResolutionDismissed(false);

      try {
        await ensureActiveSession();
      } catch {
        sendingRef.current = false;
        setIsSending(false);
        setNeedsIdentity(true);
        setIdentityError("Please enter your name and email to continue.");
        return;
      }

      setView("chat");
      markChatStarted(options?.source ?? "user", options?.flow ?? chatFlow);

      if (isAgentHandledChat(sessionStatus, handoffStatus)) {
        try {
          const saved = await sendWidgetMessage(content);
          const mapped = mapServerMessageToUi(saved);
          setMessages((current) => appendUniqueMessage(current, mapped));
          setRetryMessage(null);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to send your message. Please try again.";
          setError(message);
        } finally {
          sendingRef.current = false;
          setIsSending(false);
        }
        return;
      }

      const freshPartial = await requestFreshContext();
      const latestContext: WebsiteContext = freshPartial
        ? {
            ...mergeContext(createEmptyContext(), freshPartial),
            actions: context.actions,
          }
        : context;

      if (freshPartial) {
        setContext((current) => mergeContext(current, freshPartial));
      }

      let historySource = messages;
      if (options?.retry) {
        const last = historySource[historySource.length - 1];
        if (last?.role === "assistant") {
          historySource = historySource.slice(0, -1);
        }
      }
      if (historySource[historySource.length - 1]?.role === "user") {
        historySource = historySource.slice(0, -1);
      }
      const history = historySource.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      if (options?.retry) {
        setMessages((current) =>
          current.filter(
            (message, index) =>
              !(
                index === current.length - 1 &&
                message.role === "assistant" &&
                /couldn't complete/i.test(message.content)
              ),
          ),
        );
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message: content,
            history,
            context: toPromptContext(latestContext),
            activitySummary: summarizeActivity(latestContext.actions),
            visitorId: vid,
          }),
        });

        const data = (await response.json()) as {
          text?: string;
          aiDisabled?: boolean;
          customerMessageId?: string;
          aiMessageId?: string;
          suggestAgent?: boolean;
          suggestResolution?: boolean;
          error?: string;
        };

        if (data.aiDisabled) {
          if (data.customerMessageId) {
            setMessages((current) =>
              appendUniqueMessage(
                current,
                createMessage("user", content, {
                  id: data.customerMessageId,
                }),
              ),
            );
          }
          setRetryMessage(null);
          return;
        }

        if (!response.ok || !data.text) {
          throw new Error(data.error || "Something went wrong.");
        }

        const nextMessages: ChatMessage[] = [];
        if (data.customerMessageId) {
          nextMessages.push(
            createMessage("user", content, { id: data.customerMessageId }),
          );
        } else {
          nextMessages.push(createMessage("user", content));
        }
        nextMessages.push(
          createMessage("assistant", data.text as string, {
            id: data.aiMessageId,
            suggestAgent: Boolean(data.suggestAgent),
            suggestResolution: Boolean(data.suggestResolution),
          }),
        );

        setMessages((current) => {
          let merged = current;
          for (const message of nextMessages) {
            merged = appendUniqueMessage(merged, message);
          }
          return merged;
        });
        setRetryMessage(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "We're having trouble connecting right now. Please try again, or chat with an agent.";
        setError(message);
        setMessages((current) => {
          let merged = appendUniqueMessage(
            current,
            createMessage("user", content),
          );
          merged = appendUniqueMessage(
            merged,
            createMessage(
              "assistant",
              "I couldn't complete that reply. You can try again, or chat with an agent.",
              { suggestAgent: true },
            ),
          );
          return merged;
        });
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [
      chatFlow,
      context,
      ensureActiveSession,
      handoffStatus,
      isSessionClosed,
      markChatStarted,
      messages,
      sessionStatus,
      visitorId,
    ],
  );

  async function handleResolveChat() {
    if (isSessionClosed) return;

    try {
      await closeWidgetSession("AI_RESOLVED");
      setIsSessionClosed(true);
      setSessionStatus("CLOSED");
      setResolutionDismissed(true);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Chat closed by AI",
          createdAt: new Date().toISOString(),
          senderType: "SYSTEM",
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to close conversation.",
      );
    }
  }

  function handleNeedMoreHelp() {
    setResolutionDismissed(true);
  }

  async function handleRequestAgent() {
    if (handoffStatus !== "idle" || isSessionClosed) return;

    try {
      await ensureActiveSession();
    } catch {
      setIdentityError("Please enter your name and email first.");
      setNeedsIdentity(true);
      return;
    }

    const result = await requestAgentHandoff({
      sessionId: sessionIdRef.current ?? undefined,
      visitorId: visitorId || getOrCreateVisitorId(),
      context,
      transcript: messages,
    });

    if (result.status === "requested") {
      setHandoffStatus("requested");
      setSessionStatus("WAITING_FOR_AGENT");
      emitWidgetEvent("agent_requested", { timestamp: Date.now() });
    }
  }

  async function handleGuestIdentitySubmit() {
    setIdentityError(null);
    const name = guestName.trim();
    const email = guestEmail.trim();

    if (name.length < 2 || !email.includes("@")) {
      setIdentityError("Enter a valid name and email.");
      return;
    }

    storeGuestIdentity({ name, email });
    setNeedsIdentity(false);
    setView("welcome");
  }

  function handleQuickAction(id: QuickActionId) {
    setChatFlow(id);
    void sendMessage(QUICK_ACTION_MESSAGES[id], { source: "user", flow: id });
  }

  function handleCloseRequest() {
    setShowCloseConfirm(true);
  }

  function handleEndChatFromDialog() {
    endChat();
  }

  const isMobile = viewport.isMobile;
  const hasStoredIdentity =
    Boolean(getStoredGuestIdentity()) || Boolean(loggedInCustomer);
  const showIdentityForm =
    needsIdentity && !hasStoredIdentity && !isSessionClosed && sessionReady;

  const lastMessage = messages[messages.length - 1];
  const showResolutionPrompt =
    !isSessionClosed &&
    !resolutionDismissed &&
    handoffStatus === "idle" &&
    (sessionStatus === "AI" || sessionStatus === null) &&
    Boolean(lastMessage?.suggestResolution);

  const welcomeGreeting = loggedInCustomer
    ? {
        greetingTitle: "Hi! How can I help you today?",
        greetingSubtitle: `Welcome back, ${loggedInCustomer.name.split(" ")[0] ?? loggedInCustomer.name}.`,
      }
    : undefined;

  const handlerLabel =
    sessionStatus === "ASSIGNED" || sessionStatus === "ACTIVE"
      ? "Human Agent"
      : "AI";

  return (
    <div className="covers-widget flex h-full w-full items-end justify-end overflow-hidden">
      <div className="flex h-full w-full flex-col items-end justify-end">
        {isOpen ? (
          <section
            className={`relative flex min-h-0 w-full flex-1 overflow-hidden bg-white ${
              isMobile
                ? "rounded-xl"
                : "rounded-2xl border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.22)]"
            }`}
            aria-label="Covers&All chat"
          >
            {isBootstrapping ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                Loading chat…
              </div>
            ) : showIdentityForm ? (
              <GuestIdentityForm
                name={guestName}
                email={guestEmail}
                error={identityError}
                disabled={isSending}
                onNameChange={setGuestName}
                onEmailChange={setGuestEmail}
                onSubmit={() => void handleGuestIdentitySubmit()}
                onCloseRequest={handleCloseRequest}
              />
            ) : view === "welcome" && !isSessionClosed ? (
              <WelcomeScreen
                draft={draft}
                disabled={isSending}
                greetingTitle={welcomeGreeting?.greetingTitle}
                greetingSubtitle={welcomeGreeting?.greetingSubtitle}
                onDraftChange={setDraft}
                onSubmit={() => void sendMessage(draft, { source: "user" })}
                onQuickAction={handleQuickAction}
                onCloseRequest={handleCloseRequest}
              />
            ) : (
              <ChatWindow
                messages={messages}
                draft={draft}
                isSending={isSending}
                error={error}
                handoffStatus={handoffStatus}
                isSessionClosed={isSessionClosed}
                handlerLabel={handlerLabel}
                showResolutionPrompt={showResolutionPrompt}
                onResolveChat={() => void handleResolveChat()}
                onNeedMoreHelp={handleNeedMoreHelp}
                onDraftChange={setDraft}
                onSubmit={() => void sendMessage(draft, { source: "user" })}
                onCloseRequest={handleCloseRequest}
                onRequestAgent={() => void handleRequestAgent()}
                onStartNewChat={() => void handleStartNewChat()}
                onRetry={
                  retryMessage
                    ? () => void sendMessage(retryMessage, { retry: true })
                    : undefined
                }
              />
            )}

            {showCloseConfirm ? (
              <CloseConfirmDialog
                onCloseChat={closeChat}
                onEndChat={handleEndChatFromDialog}
                onCancel={() => setShowCloseConfirm(false)}
              />
            ) : null}
          </section>
        ) : hideLauncherWhenClosed ? null : (
          <div className="flex shrink-0 items-center justify-end p-2">
            <ChatLauncher
              isOpen={false}
              onOpen={initiateChat}
              onClose={closeChat}
            />
          </div>
        )}
      </div>
    </div>
  );
}
