"use client";

import { buildPageTokens } from "@/lib/admin/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  itemLabel = "entries",
}: PaginationProps) {
  const pageTokens = buildPageTokens(currentPage, totalPages);

  if (totalItems === 0) {
    return (
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>No {itemLabel} to display.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-medium text-slate-700">{startIndex}</span> to{" "}
        <span className="font-medium text-slate-700">{endIndex}</span> of{" "}
        <span className="font-medium text-slate-700">{totalItems}</span>{" "}
        {itemLabel}
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <PageButton
          ariaLabel="Previous page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>

        {pageTokens.map((token, index) =>
          token === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-sm text-slate-400"
              aria-hidden
            >
              …
            </span>
          ) : (
            <PageButton
              key={token}
              ariaLabel={`Page ${token}`}
              active={token === currentPage}
              onClick={() => onPageChange(token)}
            >
              {token}
            </PageButton>
          ),
        )}

        <PageButton
          ariaLabel="Next page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </nav>
    </div>
  );
}

type PageButtonProps = {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
};

function PageButton({
  children,
  onClick,
  disabled,
  active,
  ariaLabel,
}: PageButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-[var(--covers-blue)] text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
