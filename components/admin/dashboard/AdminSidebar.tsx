"use client";

import { SidebarBrand } from "@/components/admin/shared/SidebarBrand";
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PieChart,
  ScrollText,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { isAdmin } from "@/lib/auth/roles";
import type { AuthenticatedUser } from "@/lib/auth/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/dashboard/chats", label: "Chats", icon: MessageSquare, adminOnly: false },
  { href: "/dashboard/overview", label: "Overview", icon: PieChart, adminOnly: false },
  {
    href: "/dashboard/create-customer",
    label: "Create Customer",
    icon: UserPlus,
    adminOnly: true,
  },
  { href: "/dashboard/logs", label: "Agent Logs", icon: ScrollText, adminOnly: false },
] as const;

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
  user: AuthenticatedUser;
};

export function AdminSidebar({ mobileOpen, onMobileClose, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const showAdminLinks = isAdmin(user);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || showAdminLinks,
  );

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      onMobileClose();
    }
  }

  const nav = (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 lg:block">
        <SidebarBrand />
        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin navigation">
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[var(--covers-blue-soft)] text-[var(--covers-blue)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {label}
              {active ? (
                <span className="ml-auto h-5 w-1 rounded-full bg-[var(--covers-blue)] lg:hidden" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          {isLoggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
