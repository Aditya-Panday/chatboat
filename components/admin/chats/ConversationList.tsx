"use client";

import type { ChatFilterTab, Conversation } from "@/lib/admin/chats-data";
import { Search } from "lucide-react";
import { memo } from "react";

type ConversationListItemProps = {
  conversation: Conversation;
  active: boolean;
  onSelect: (id: string) => void;
};

export const ConversationListItem = memo(function ConversationListItem({
  conversation,
  active,
  onSelect,
}: ConversationListItemProps) {
  const { customer } = conversation;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-slate-50/80 ${
        active ? "bg-[var(--covers-blue-soft)]/60" : "bg-white"
      }`}
    >
      <div className="relative shrink-0">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${customer.avatarClassName}`}
        >
          {customer.initials}
        </span>
        {customer.status === "online" ? (
          <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">
            {customer.name}
          </span>
          <span className="shrink-0 text-[11px] text-slate-400">
            {conversation.time}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">
          {conversation.preview}
        </p>
      </div>

      {conversation.unreadCount > 0 ? (
        <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--covers-blue)] px-1.5 text-[10px] font-bold text-white">
          {conversation.unreadCount}
        </span>
      ) : null}
    </button>
  );
});

type ConversationListProps = {
  conversations: Conversation[];
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: ChatFilterTab;
  onTabChange: (tab: ChatFilterTab) => void;
  onSelect: (id: string) => void;
  tabs: { value: ChatFilterTab; label: string }[];
};

export function ConversationList({
  conversations,
  selectedId,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  onSelect,
  tabs,
}: ConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white lg:w-[340px] lg:shrink-0 xl:w-[380px]">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-bold text-slate-900">Conversations</h2>

        <label className="relative mt-3 block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search chats..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 pr-3 pl-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--covers-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--covers-blue-soft)]"
          />
        </label>

        <div className="mt-3 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.value
                  ? "bg-[var(--covers-blue-soft)] text-[var(--covers-blue)]"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No conversations found.
          </p>
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
