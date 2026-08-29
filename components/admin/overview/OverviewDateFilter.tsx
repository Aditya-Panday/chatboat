"use client";

import { DATE_RANGE_OPTIONS, type DateRangeValue } from "@/lib/admin/overview-data";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useId, useState } from "react";

export function OverviewDateFilter() {
  const [range, setRange] = useState<DateRangeValue>("7d");
  const [open, setOpen] = useState(false);
  const listId = useId();

  const selected =
    DATE_RANGE_OPTIONS.find((option) => option.value === range)?.label ??
    "Last 7 Days";

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 sm:min-w-[160px]"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />
          {selected}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close date range menu"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <ul
            id={listId}
            role="listbox"
            className="absolute right-0 z-20 mt-1 w-full min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <li key={option.value} role="option" aria-selected={range === option.value}>
                <button
                  type="button"
                  onClick={() => {
                    setRange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                    range === option.value
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
  );
}
