import { DashboardShell } from "@/components/admin/dashboard/DashboardShell";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Dashboard | Covers&All Admin",
  description: "Covers&All chat admin console.",
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="admin-theme">
      <DashboardShell userName="Aditya">{children}</DashboardShell>
    </div>
  );
}
