"use client";

import {
  LogDescription,
  LogEventBadge,
  LogUserCell,
} from "@/components/admin/logs/LogEventBadge";
import { LOG_EVENT_CONFIG } from "@/lib/admin/logs-data";
import type { AgentLogEntry } from "@/lib/admin/logs-data";
import { CalendarDays, ChevronDown, Download, Search } from "lucide-react";
import { useId, useState } from "react";
import {
  LOG_EVENT_FILTER_OPTIONS,
  type LogEventFilterValue,
} from "@/lib/admin/logs-data";

type LogsToolbarProps = {
  search: string;
  eventFilter: LogEventFilterValue;
  onSearchChange: (value: string) => void;
  onEventFilterChange: (value: LogEventFilterValue) => void;
  onExport: () => void;
};

export function LogsToolbar({
  search,
  eventFilter,
  onSearchChange,
  onEventFilterChange,
  onExport,
}: LogsToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const listId = useId();

  const selectedLabel =
    LOG_EVENT_FILTER_OPTIONS.find((option) => option.value === eventFilter)
      ?.label ?? "All Event Types";

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
      <label className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search logs..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-[var(--covers-blue-soft)]"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
            aria-controls={listId}
            onClick={() => setFilterOpen((current) => !current)}
            className="flex h-10 min-w-[150px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
          >
            {selectedLabel}
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition ${filterOpen ? "rotate-180" : ""}`}
            />
          </button>
          {filterOpen ? (
            <>
              <button
                type="button"
                aria-label="Close event filter"
                className="fixed inset-0 z-10"
                onClick={() => setFilterOpen(false)}
              />
              <ul
                id={listId}
                role="listbox"
                className="absolute right-0 z-20 mt-1 max-h-60 w-full min-w-[180px] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              >
                {LOG_EVENT_FILTER_OPTIONS.map((option) => (
                  <li key={option.value} role="option">
                    <button
                      type="button"
                      onClick={() => {
                        onEventFilterChange(option.value);
                        setFilterOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        eventFilter === option.value
                          ? "font-semibold text-[var(--covers-blue)]"
                          : "text-slate-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
        >
          <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />
          Oct 1 – Oct 14, 2023
        </button>

        <button
          type="button"
          onClick={onExport}
          className="flex h-10 items-center gap-2 rounded-lg bg-[var(--covers-blue-soft)] px-4 text-sm font-semibold text-[var(--covers-blue)] transition hover:bg-blue-100"
        >
          <Download className="h-4 w-4" aria-hidden />
          Export
        </button>
      </div>
    </div>
  );
}

export function LogsTable({ entries }: { entries: AgentLogEntry[] }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="bg-violet-50/70 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            <th className="px-6 py-3">Event</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">User</th>
            <th className="px-6 py-3 text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-slate-50/60">
              <td className="px-6 py-4">
                <LogEventBadge eventType={entry.eventType} />
              </td>
              <td className="max-w-md px-4 py-4">
                <LogDescription parts={entry.descriptionParts} />
              </td>
              <td className="px-4 py-4">
                <LogUserCell user={entry.user} />
              </td>
              <td className="px-6 py-4 text-right whitespace-nowrap text-slate-500">
                {entry.timestamp}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LogsMobileList({ entries }: { entries: AgentLogEntry[] }) {
  return (
    <ul className="divide-y divide-slate-100 lg:hidden">
      {entries.map((entry) => {
        const config = LOG_EVENT_CONFIG[entry.eventType];
        return (
          <li key={entry.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <LogEventBadge eventType={entry.eventType} compact />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-sm font-semibold ${config.badgeClassName}`}>
                    {config.label}
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {entry.shortTimestamp}
                  </span>
                </div>
                <div className="mt-1.5">
                  <LogDescription parts={entry.descriptionParts} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
