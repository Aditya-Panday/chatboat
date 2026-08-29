"use client";

import { AssignAgentModal } from "@/components/admin/chats/AssignAgentModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type RecentChatRow = {
  id: string;
  customer: { name: string; initials: string; avatarClassName: string };
  subject: string;
  agent: string;
  status: string;
  time: string;
};

const STATUS_STYLES: Record<string, string> = {
  AI: "bg-violet-50 text-violet-700 ring-violet-100",
  Waiting: "bg-amber-50 text-amber-700 ring-amber-100",
  Assigned: "bg-blue-50 text-blue-700 ring-blue-100",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset sm:text-xs ${STATUS_STYLES[status] ?? STATUS_STYLES.Closed}`}
    >
      {status}
    </span>
  );
}

function CustomerCell({ chat }: { chat: RecentChatRow }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${chat.customer.avatarClassName}`}
      >
        {chat.customer.initials}
      </span>
      <span className="font-medium text-slate-900">{chat.customer.name}</span>
    </div>
  );
}

function canAssignChat(status: string) {
  return status !== "Closed";
}

type RecentChatsPanelProps = {
  chats: RecentChatRow[];
  canAssign?: boolean;
};

export function RecentChatsPanel({
  chats: initialChats,
  canAssign = false,
}: RecentChatsPanelProps) {
  const router = useRouter();
  const [chats, setChats] = useState(initialChats);
  const [assignSessionId, setAssignSessionId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  const openAssignModal = useCallback((sessionId: string) => {
    setAssignSessionId(sessionId);
    setShowAssignModal(true);
  }, []);

  const handleAssigned = useCallback(() => {
    setShowAssignModal(false);
    setAssignSessionId(null);
    router.refresh();
  }, [router]);

  return (
    <section className="relative rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
          Recent Chats
        </h2>
      </div>

      {chats.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-500">
          No conversations yet.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Time</th>
                  {canAssign ? (
                    <th className="px-6 py-3 text-right">Action</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chats.map((chat) => (
                  <tr key={chat.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <CustomerCell chat={chat} />
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-4 text-slate-600">
                      {chat.subject}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{chat.agent}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={chat.status} />
                    </td>
                    <td className="px-4 py-4 text-right text-slate-500">
                      {chat.time}
                    </td>
                    {canAssign ? (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/chats?session=${chat.id}`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </Link>
                          {canAssignChat(chat.status) ? (
                            <button
                              type="button"
                              onClick={() => openAssignModal(chat.id)}
                              className="rounded-lg bg-[var(--covers-blue)] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--covers-blue-dark)]"
                            >
                              Assign
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 md:hidden">
            {chats.map((chat) => (
              <li key={chat.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${chat.customer.avatarClassName}`}
                  >
                    {chat.customer.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {chat.customer.name}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {chat.subject}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">
                        {chat.time}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={chat.status} />
                      <Link
                        href={`/dashboard/chats?session=${chat.id}`}
                        className="text-xs font-semibold text-[var(--covers-blue)] hover:underline"
                      >
                        View
                      </Link>
                      {canAssign && canAssignChat(chat.status) ? (
                        <button
                          type="button"
                          onClick={() => openAssignModal(chat.id)}
                          className="text-xs font-semibold text-[var(--covers-blue)] hover:underline"
                        >
                          Assign
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="border-t border-slate-100 px-4 py-4 text-center sm:px-6">
        <Link
          href="/dashboard/chats"
          className="text-sm font-semibold text-[var(--covers-blue)] hover:underline"
        >
          View All Chats
        </Link>
      </div>

      {assignSessionId ? (
        <AssignAgentModal
          sessionId={assignSessionId}
          open={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssignSessionId(null);
          }}
          onAssigned={handleAssigned}
        />
      ) : null}
    </section>
  );
}
