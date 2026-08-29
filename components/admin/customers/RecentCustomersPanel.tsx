"use client";

import type { RecentCustomer } from "@/lib/admin/customers-data";
import { Ban, KeyRound } from "lucide-react";
import type { ReactNode } from "react";

type RecentCustomersPanelProps = {
  customers: RecentCustomer[];
  onResetPassword: (customer: RecentCustomer) => void;
  onToggleBlock: (customerId: string) => void;
};

export function RecentCustomersPanel({
  customers,
  onResetPassword,
  onToggleBlock,
}: RecentCustomersPanelProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-bold text-slate-900">Recent Additions</h3>

      <ul className="mt-5 divide-y divide-slate-100">
        {customers.map((customer) => (
          <li key={customer.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
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

            <div className="flex shrink-0 items-center gap-1">
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
            </div>
          </li>
        ))}
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
