"use client";

import { ActiveChatPanel } from "@/components/admin/chats/ActiveChatPanel";
import { AssignAgentModal } from "@/components/admin/chats/AssignAgentModal";
import { ConversationList } from "@/components/admin/chats/ConversationList";
import {
  CHAT_FILTER_TABS,
  type ChatFilterTab,
  type ChatMessage,
  type Conversation,
} from "@/lib/admin/chats-data";
import {
  fetchConversationDetail,
  fetchConversations,
  resolveConversation,
  sendAgentMessage,
} from "@/lib/admin/conversations-client";
import { Pagination } from "@/components/admin/shared/Pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

function ChatInboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ChatFilterTab>("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 30,
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const deepLinkHandled = useRef<string | null>(null);

  const syncSessionParam = useCallback(
    (sessionId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sessionId) {
        params.set("session", sessionId);
      } else {
        params.delete("session");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const openSessionById = useCallback(
    async (sessionId: string, updateUrl = true) => {
      setSelectedId(sessionId);
      setMobileView("chat");
      if (updateUrl) syncSessionParam(sessionId);

      try {
        const detail = await fetchConversationDetail(sessionId);
        setMessagesByChat((current) => ({
          ...current,
          [sessionId]: detail.messages,
        }));
        setConversations((current) => {
          const exists = current.some((item) => item.id === sessionId);
          if (exists) {
            return current.map((item) =>
              item.id === sessionId ? detail.conversation : item,
            );
          }
          return [detail.conversation, ...current];
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Conversation not found or access denied.",
        );
      }
    },
    [syncSessionParam],
  );

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchConversations({ tab: activeTab, search, page });
      setConversations(result.conversations);
      setPagination({
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        limit: result.pagination.limit,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chats.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const sessionParam = searchParams.get("session");
    if (!sessionParam || deepLinkHandled.current === sessionParam) return;

    deepLinkHandled.current = sessionParam;
    void openSessionById(sessionParam, false);
  }, [openSessionById, searchParams]);

  useEffect(() => {
    if (!selectedId) return;

    void fetchConversationDetail(selectedId)
      .then((detail) => {
        setMessagesByChat((current) => ({
          ...current,
          [selectedId]: detail.messages,
        }));
        setConversations((current) =>
          current.map((item) =>
            item.id === selectedId ? detail.conversation : item,
          ),
        );
      })
      .catch(() => undefined);
  }, [selectedId]);

  useEffect(() => {
    const source = new EventSource("/api/realtime");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          sessionId?: string;
        };
        if (
          payload.type === "conversation.updated" ||
          payload.type === "conversation.assigned" ||
          payload.type === "message.created" ||
          payload.type === "conversation.closed"
        ) {
          void loadConversations();
          if (payload.sessionId && payload.sessionId === selectedId) {
            void fetchConversationDetail(payload.sessionId).then((detail) => {
              setMessagesByChat((current) => ({
                ...current,
                [payload.sessionId!]: detail.messages,
              }));
            });
          }
        }
      } catch {
        // ignore
      }
    };

    return () => source.close();
  }, [loadConversations, selectedId]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const activeMessages = useMemo(
    () => (selectedId ? (messagesByChat[selectedId] ?? []) : []),
    [messagesByChat, selectedId],
  );

  const handleSelectConversation = useCallback(
    (id: string) => {
      void openSessionById(id);
    },
    [openSessionById],
  );

  const handleBack = useCallback(() => {
    setMobileView("list");
    syncSessionParam(null);
  }, [syncSessionParam]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!selectedId) return;

      try {
        await sendAgentMessage(selectedId, content);
        const detail = await fetchConversationDetail(selectedId);
        setMessagesByChat((current) => ({
          ...current,
          [selectedId]: detail.messages,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message.");
      }
    },
    [selectedId],
  );

  const handleResolve = useCallback(async () => {
    if (!selectedId) return;

    try {
      await resolveConversation(selectedId);
      setActiveTab("resolved");
      setPage(1);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedId
            ? {
                ...conversation,
                status: "resolved",
                sessionStatus: "CLOSED",
                statusLabel: "Closed",
                customer: { ...conversation.customer, status: "offline" },
              }
            : conversation,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve chat.");
    }
  }, [selectedId]);

  const showListOnMobile = mobileView === "list";
  const showChatOnMobile = mobileView === "chat";

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {error ? (
        <p className="absolute top-2 right-4 z-10 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div
        className={`${
          showListOnMobile ? "flex" : "hidden"
        } h-full min-h-0 w-full flex-col lg:flex lg:w-auto`}
      >
        {loading && conversations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Loading conversations…
          </div>
        ) : (
          <>
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              search={search}
              onSearchChange={setSearch}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSelect={handleSelectConversation}
              tabs={CHAT_FILTER_TABS}
            />
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              startIndex={
                pagination.total === 0
                  ? 0
                  : (page - 1) * pagination.limit + 1
              }
              endIndex={Math.min(page * pagination.limit, pagination.total)}
              onPageChange={setPage}
              itemLabel="conversations"
            />
          </>
        )}
      </div>

      <div
        className={`${
          showChatOnMobile ? "flex" : "hidden"
        } relative h-full min-h-0 w-full min-w-0 flex-col lg:flex lg:flex-1`}
      >
        <ActiveChatPanel
          conversation={selectedConversation}
          messages={activeMessages}
          onBack={handleBack}
          onSend={(content) => void handleSend(content)}
          onResolve={() => void handleResolve()}
          onAssign={() => setShowAssignModal(true)}
          showBackButton
        />

        {selectedId ? (
          <AssignAgentModal
            sessionId={selectedId}
            open={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssigned={() => void loadConversations()}
          />
        ) : null}
      </div>
    </div>
  );
}

function ChatInboxFallback() {
  return (
    <div className="flex h-full min-h-[480px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
      Loading inbox…
    </div>
  );
}

export function ChatInbox() {
  return (
    <Suspense fallback={<ChatInboxFallback />}>
      <ChatInboxContent />
    </Suspense>
  );
}
