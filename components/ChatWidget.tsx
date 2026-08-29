"use client";

import { ChatLauncher } from "@/components/ChatLauncher";
import { ChatWindow } from "@/components/ChatWindow";
import { CloseConfirmDialog } from "@/components/CloseConfirmDialog";
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
import { requestAgentHandoff } from "@/lib/handoff";
import type { ChatFlow, ChatLifecycle } from "@/lib/widget-protocol";
import type {
  ChatMessage,
  HandoffStatus,
  HostToWidgetMessage,
  HostViewport,
  WebsiteContext,
  WidgetView,
} from "@/lib/types";
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
  suggestAgent = false,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    suggestAgent,
  };
}

function resolveLifecycle(
  view: WidgetView,
  handoffStatus: HandoffStatus,
): ChatLifecycle {
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
  const sendingRef = useRef(false);
  const chatStartedRef = useRef(false);

  const lifecycle = resolveLifecycle(view, handoffStatus);

  const reportOpenState = useCallback(
    (open: boolean) => {
      postToHost({
        source: "coversall-chat",
        type: "state",
        payload: { open, lifecycle: resolveLifecycle(view, handoffStatus) },
      });
    },
    [view, handoffStatus],
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
    sendingRef.current = false;
    chatStartedRef.current = false;
    emitWidgetEvent("chat_ended", { timestamp: Date.now() });
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
      if (!content || sendingRef.current) return;

      const sessionId = visitorId || getOrCreateVisitorId();
      if (!visitorId) {
        setVisitorId(sessionId);
      }

      sendingRef.current = true;
      setIsSending(true);
      setError(null);
      setRetryMessage(content);
      setView("chat");
      setDraft("");
      setIsOpen(true);
      markChatStarted(options?.source ?? "user", options?.flow ?? chatFlow);

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
      } else {
        setMessages((current) => [...current, createMessage("user", content)]);
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history,
            context: toPromptContext(latestContext),
            activitySummary: summarizeActivity(latestContext.actions),
            visitorId: sessionId,
          }),
        });

        const data = (await response.json()) as {
          text?: string;
          suggestAgent?: boolean;
          error?: string;
        };

        if (!response.ok || !data.text) {
          throw new Error(data.error || "Something went wrong.");
        }

        setMessages((current) => [
          ...current,
          createMessage(
            "assistant",
            data.text as string,
            Boolean(data.suggestAgent),
          ),
        ]);
        setRetryMessage(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "We're having trouble connecting right now. Please try again, or chat with an agent.";
        setError(message);
        setMessages((current) => [
          ...current,
          createMessage(
            "assistant",
            "I couldn't complete that reply. You can try again, or chat with an agent.",
            true,
          ),
        ]);
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [chatFlow, context, markChatStarted, messages, visitorId],
  );

  async function handleRequestAgent() {
    if (handoffStatus === "requested") return;

    const result = await requestAgentHandoff({
      visitorId: visitorId || getOrCreateVisitorId(),
      context,
      transcript: messages,
    });

    if (result.status === "requested") {
      setHandoffStatus("requested");
      emitWidgetEvent("agent_requested", { timestamp: Date.now() });
    }
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
            {view === "welcome" ? (
              <WelcomeScreen
                draft={draft}
                disabled={isSending}
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
                onDraftChange={setDraft}
                onSubmit={() => void sendMessage(draft, { source: "user" })}
                onCloseRequest={handleCloseRequest}
                onRequestAgent={() => void handleRequestAgent()}
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
