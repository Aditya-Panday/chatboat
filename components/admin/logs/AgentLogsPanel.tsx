"use client";

import {
  LogsMobileList,
  LogsTable,
  LogsToolbar,
} from "@/components/admin/logs/LogsToolbar";
import { Pagination } from "@/components/admin/shared/Pagination";
import {
  AGENT_LOGS,
  matchesLogSearch,
  type LogEventFilterValue,
} from "@/lib/admin/logs-data";
import { paginateItems } from "@/lib/admin/pagination";
import { useCallback, useMemo, useState } from "react";

const LOGS_PAGE_SIZE = 4;

export function AgentLogsPanel() {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<LogEventFilterValue>("all");
  const [page, setPage] = useState(1);

  const filteredLogs = useMemo(() => {
    const query = search.trim();

    return AGENT_LOGS.filter((entry) => {
      const matchesEvent =
        eventFilter === "all" || entry.eventType === eventFilter;
      const matchesQuery = !query || matchesLogSearch(entry, query);
      return matchesEvent && matchesQuery;
    });
  }, [search, eventFilter]);

  const pagination = useMemo(
    () => paginateItems(filteredLogs, page, LOGS_PAGE_SIZE),
    [filteredLogs, page],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleEventFilterChange = useCallback((value: LogEventFilterValue) => {
    setEventFilter(value);
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    const header = "Event,Description,User,Role,Timestamp\n";
    const rows = filteredLogs
      .map((entry) => {
        const description = entry.descriptionParts.map((part) => part.text).join("");
        return [
          entry.eventType,
          `"${description.replace(/"/g, '""')}"`,
          entry.user.name,
          entry.user.role,
          entry.timestamp,
        ].join(",");
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agent-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-5 sm:px-6 lg:hidden">
        <h3 className="text-lg font-bold text-slate-900">Agent Logs</h3>
      </div>

      <LogsToolbar
        search={search}
        eventFilter={eventFilter}
        onSearchChange={handleSearchChange}
        onEventFilterChange={handleEventFilterChange}
        onExport={handleExport}
      />

      {pagination.totalItems === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6">
          No logs match your filters.
        </div>
      ) : (
        <>
          <LogsTable entries={pagination.items} />
          <LogsMobileList entries={pagination.items} />
        </>
      )}

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={setPage}
      />
    </section>
  );
}
