"use client";

import { AdminSidebar } from "@/components/admin/dashboard/AdminSidebar";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { NotificationModal } from "@/components/admin/dashboard/NotificationModal";
import type { AdminNotificationItem } from "@/lib/admin/notifications-client";
import {
  fetchNotifications,
  markAllNotificationsRead,
} from "@/lib/admin/notifications-client";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
  user: AuthenticatedUser;
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // keep previous state on failure
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const source = new EventSource("/api/realtime");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (
          payload.type === "notification.created" ||
          payload.type === "notification.read"
        ) {
          void loadNotifications();
        }
      } catch {
        // ignore
      }
    };

    return () => source.close();
  }, [loadNotifications]);

  const primaryRole = user.roles[0]?.name ?? "Staff";

  async function handleCloseNotifications() {
    setNotificationsOpen(false);
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, unread: false })),
      );
      setUnreadCount(0);
      setNotificationsOpen(false);
    } catch {
      setNotificationsOpen(false);
    }
  }

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
          onNotificationClick={() => {
            setNotificationsOpen(true);
            void loadNotifications();
          }}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <NotificationModal
        open={notificationsOpen}
        notifications={notifications}
        loading={loadingNotifications}
        onClose={() => void handleCloseNotifications()}
        onMarkAllRead={() => void handleMarkAllRead()}
      />
    </div>
  );
}
