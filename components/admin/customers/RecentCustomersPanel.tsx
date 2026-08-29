"use client";

import type { RecentCustomer } from "@/lib/admin/customers-data";
import { Ban, KeyRound, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

type RecentCustomersPanelProps = {
  customers: RecentCustomer[];
  loadError?: string | null;
  onResetPassword: (customer: RecentCustomer) => void;
  onToggleBlock: (customerId: string) => void;
  onDelete: (customer: RecentCustomer) => void;
};

export function RecentCustomersPanel({
  customers,
  loadError,
  onResetPassword,
  onToggleBlock,
  onDelete,
}: RecentCustomersPanelProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-bold text-slate-900">Recent Additions</h3>

      {loadError ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {loadError}
        </p>
      ) : null}

      <ul className="mt-5 divide-y divide-slate-100">
        {customers.length === 0 ? (
          <li className="py-4 text-sm text-slate-500">No users yet.</li>
        ) : (
          customers.map((customer) => (
            <li
              key={customer.id}
              className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${customer.avatarClassName} ${customer.blocked ? "opacity-50" : ""}`}
              >
                {customer.initials}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold text-slate-900 ${customer.blocked ? "line-through opacity-60" : ""}`}
                >
                  {customer.name}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {customer.blocked ? "Blocked" : customer.role}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <IconButton
                  label={`Reset password for ${customer.name}`}
                  onClick={() => onResetPassword(customer)}
                  className="text-slate-400 hover:bg-blue-50 hover:text-[var(--covers-blue)]"
                >
                  <KeyRound className="h-4 w-4" strokeWidth={2} />
                </IconButton>
                <IconButton
                  label={
                    customer.blocked
                      ? `Unblock ${customer.name}`
                      : `Block ${customer.name}`
                  }
                  onClick={() => onToggleBlock(customer.id)}
                  className={
                    customer.blocked
                      ? "text-red-500 hover:bg-red-50 hover:text-red-600"
                      : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                  }
                >
                  <Ban className="h-4 w-4" strokeWidth={2} />
                </IconButton>
                <IconButton
                  label={`Delete ${customer.name}`}
                  onClick={() => onDelete(customer)}
                  className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </IconButton>
              </div>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

type IconButtonProps = {
  children: ReactNode;
  label: string;
  onClick: () => void;
  className: string;
};

function IconButton({ children, label, onClick, className }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${className}`}
    >
      {children}
    </button>
  );
}
