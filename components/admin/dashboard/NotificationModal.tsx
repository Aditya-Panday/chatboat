"use client";

import type { AdminNotification } from "@/lib/admin/dashboard-data";
import { Bell, X } from "lucide-react";
import { useEffect } from "react";

type NotificationModalProps = {
  open: boolean;
  notifications: AdminNotification[];
  onClose: () => void;
};

export function NotificationModal({
  open,
  notifications,
  onClose,
}: NotificationModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
    >
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 bg-slate-900/45"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--covers-blue)]" />
            <h2
              id="notification-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                {unreadCount} new
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="max-h-[min(420px,60dvh)] divide-y divide-slate-100 overflow-y-auto">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={`px-5 py-4 ${item.unread ? "bg-blue-50/40" : "bg-white"}`}
            >
              <div className="flex items-start gap-3">
                {item.unread ? (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--covers-blue)]" />
                ) : (
                  <span className="mt-1.5 h-2 w-2 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {item.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{item.time}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg py-2 text-sm font-medium text-[var(--covers-blue)] hover:bg-[var(--covers-blue-soft)]"
          >
            Mark all as read & close
          </button>
        </div>
      </div>
    </div>
  );
}
