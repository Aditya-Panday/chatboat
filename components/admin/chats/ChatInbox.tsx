"use client";

import { ActiveChatPanel } from "@/components/admin/chats/ActiveChatPanel";
import { ConversationList } from "@/components/admin/chats/ConversationList";
import {
  CHAT_FILTER_TABS,
  CONVERSATION_MESSAGES,
  CONVERSATIONS,
  createAgentMessage,
  filterConversations,
  type ChatFilterTab,
  type ChatMessage,
  type Conversation,
} from "@/lib/admin/chats-data";
import { useCallback, useMemo, useState } from "react";

export function ChatInbox() {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >(CONVERSATION_MESSAGES);
  const [selectedId, setSelectedId] = useState<string | null>(
    CONVERSATIONS[0]?.id ?? null,
  );
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ChatFilterTab>("all");

  const filteredConversations = useMemo(
    () => filterConversations(conversations, activeTab, search),
    [conversations, activeTab, search],
  );

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const activeMessages = useMemo(
    () => (selectedId ? (messagesByChat[selectedId] ?? []) : []),
    [messagesByChat, selectedId],
  );

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
    setMobileView("chat");
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
  }, []);

  const handleBack = useCallback(() => {
    setMobileView("list");
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      if (!selectedId) return;

      const newMessage = createAgentMessage(content);
      setMessagesByChat((current) => ({
        ...current,
        [selectedId]: [...(current[selectedId] ?? []), newMessage],
      }));

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedId
            ? { ...conversation, preview: content, time: "Just now" }
            : conversation,
        ),
      );
    },
    [selectedId],
  );

  const handleResolve = useCallback(() => {
    if (!selectedId) return;

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedId
          ? { ...conversation, status: "resolved" as Conversation["status"] }
          : conversation,
      ),
    );
  }, [selectedId]);

  const handleTabChange = useCallback((tab: ChatFilterTab) => {
    setActiveTab(tab);
  }, []);

  const showListOnMobile = mobileView === "list";
  const showChatOnMobile = mobileView === "chat";

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`${
          showListOnMobile ? "flex" : "hidden"
        } h-full min-h-0 w-full flex-col lg:flex lg:w-auto`}
      >
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedId}
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSelect={handleSelectConversation}
          tabs={CHAT_FILTER_TABS}
        />
      </div>

      <div
        className={`${
          showChatOnMobile ? "flex" : "hidden"
        } h-full min-h-0 w-full min-w-0 flex-col lg:flex lg:flex-1`}
      >
        <ActiveChatPanel
          conversation={selectedConversation}
          messages={activeMessages}
          onBack={handleBack}
          onSend={handleSend}
          onResolve={handleResolve}
          showBackButton
        />
      </div>
    </div>
  );
}
