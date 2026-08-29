"use client";

import { Bell, Menu } from "lucide-react";

type DashboardHeaderProps = {
  userName?: string;
  onMenuClick: () => void;
  onNotificationClick: () => void;
  unreadCount?: number;
};

export function DashboardHeader({
  userName = "Aditya",
  onMenuClick,
  onNotificationClick,
  unreadCount = 0,
}: DashboardHeaderProps) {
  const initials = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          Admin Panel
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onNotificationClick}
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          ) : null}
        </button>

        <div className="flex items-center gap-2.5 pl-1 sm:gap-3 sm:pl-2">
          <span className="hidden text-sm font-medium text-slate-700 sm:inline">
            {userName}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--covers-blue)] text-sm font-semibold text-white">
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}
