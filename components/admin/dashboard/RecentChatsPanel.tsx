import {
  RECENT_CHATS,
  STATUS_STYLES,
  type RecentChat,
} from "@/lib/admin/dashboard-data";
import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";

function StatusBadge({ status }: { status: RecentChat["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset sm:text-xs ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function CustomerCell({ chat }: { chat: RecentChat }) {
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

export function RecentChatsPanel() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
          Recent Chats
        </h2>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          aria-label="Filter chats"
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              <th className="px-6 py-3">Customer</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-6 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {RECENT_CHATS.map((chat) => (
              <tr key={chat.id} className="hover:bg-slate-50/60">
                <td className="px-6 py-4">
                  <CustomerCell chat={chat} />
                </td>
                <td className="px-4 py-4 text-slate-600">{chat.subject}</td>
                <td className="px-4 py-4 text-slate-600">{chat.agent}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={chat.status} />
                </td>
                <td className="px-6 py-4 text-right text-slate-500">{chat.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {RECENT_CHATS.map((chat) => (
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
                    <p className="mt-0.5 text-sm text-slate-500">{chat.subject}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{chat.time}</span>
                </div>
                <div className="mt-2">
                  <StatusBadge status={chat.status} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-100 px-4 py-4 text-center sm:px-6">
        <Link
          href="/dashboard/chats"
          className="text-sm font-semibold text-[var(--covers-blue)] hover:underline"
        >
          View All Chats
        </Link>
      </div>
    </section>
  );
}
