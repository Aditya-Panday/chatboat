import {
  AGENT_STATUS_STYLES,
  TOP_AGENTS,
  type TopAgent,
} from "@/lib/admin/overview-data";
import { Star } from "lucide-react";
import Link from "next/link";

function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index < fullStars || (index === fullStars && hasHalf);
          return (
            <Star
              key={index}
              className={`h-3.5 w-3.5 ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              }`}
            />
          );
        })}
      </div>
      <span className="text-sm font-semibold text-slate-900">{score.toFixed(1)}</span>
    </div>
  );
}

function AgentAvatar({ agent }: { agent: TopAgent }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${agent.avatarClassName}`}
    >
      {agent.initials}
    </span>
  );
}

function StatusBadge({ status }: { status: TopAgent["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${AGENT_STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function TopAgentsTable() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
          Top Performing Agents{" "}
          <span className="font-normal text-slate-500">(Human Escalation)</span>
        </h3>
        <Link
          href="/dashboard/chats"
          className="text-sm font-semibold text-[var(--covers-blue)] hover:underline"
        >
          View All
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              <th className="px-6 py-3">Agent</th>
              <th className="px-4 py-3">Chats Handled</th>
              <th className="px-4 py-3">Avg Resolution Time</th>
              <th className="px-4 py-3">CSAT Score</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TOP_AGENTS.map((agent) => (
              <tr key={agent.id} className="hover:bg-slate-50/60">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <AgentAvatar agent={agent} />
                    <span className="font-medium text-slate-900">{agent.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 font-medium text-slate-700">
                  {agent.chatsHandled}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {agent.avgResolutionTime}
                </td>
                <td className="px-4 py-4">
                  <StarRating score={agent.csatScore} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={agent.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <ul className="divide-y divide-slate-100 lg:hidden">
        {TOP_AGENTS.map((agent) => (
          <li key={agent.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <AgentAvatar agent={agent} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{agent.name}</p>
                  <StatusBadge status={agent.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400">Chats Handled</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">
                      {agent.chatsHandled}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Avg Resolution</dt>
                    <dd className="mt-0.5 font-medium text-slate-700">
                      {agent.avgResolutionTime}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-400">CSAT Score</dt>
                    <dd className="mt-1">
                      <StarRating score={agent.csatScore} />
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
