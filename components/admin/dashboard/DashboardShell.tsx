"use client";

import { AdminSidebar } from "@/components/admin/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { NotificationModal } from "@/components/admin/dashboard/NotificationModal";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { ADMIN_NOTIFICATIONS } from "@/lib/admin/dashboard-data";
import { useMemo, useState, type ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
  user: AuthenticatedUser;
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = useMemo(
    () => ADMIN_NOTIFICATIONS.filter((item) => item.unread).length,
    [],
  );

  const primaryRole = user.roles[0]?.name ?? "Staff";

  return (
    <div className="flex min-h-dvh bg-[var(--admin-page-bg)]">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        user={user}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          userName={user.name}
          userRole={primaryRole}
          unreadCount={unreadCount}
          onMenuClick={() => setMobileOpen(true)}
          onNotificationClick={() => setNotificationsOpen(true)}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <NotificationModal
        open={notificationsOpen}
        notifications={ADMIN_NOTIFICATIONS}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
