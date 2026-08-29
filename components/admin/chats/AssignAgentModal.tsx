"use client";

import { fetchAvailableAgents, assignConversation } from "@/lib/admin/conversations-client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

type AssignAgentModalProps = {
  sessionId: string;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
};

export function AssignAgentModal({
  sessionId,
  open,
  onClose,
  onAssigned,
}: AssignAgentModalProps) {
  const [agents, setAgents] = useState<
    Array<{
      id: string;
      name: string;
      activeChatCount: number;
      status: string;
      isOnline: boolean;
    }>
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    void fetchAvailableAgents()
      .then(setAgents)
      .catch(() => setError("Unable to load agents."))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = agents.filter((agent) =>
    agent.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function handleAssign(agentId: string) {
    setAssigningId(agentId);
    setError(null);
    try {
      await assignConversation(sessionId, agentId);
      onAssigned();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed.");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Assign Conversation
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--covers-blue)]"
          />
        </div>

        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              Loading agents…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              No agents found.
            </p>
          ) : (
            filtered.map((agent) => (
              <button
                key={agent.id}
                type="button"
                disabled={assigningId !== null}
                onClick={() => void handleAssign(agent.id)}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-50 disabled:opacity-60"
              >
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-300" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {agent.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {agent.activeChatCount} active chats ·{" "}
                    {agent.isOnline ? agent.status : "Offline"}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        {error ? (
          <p className="px-4 pb-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
