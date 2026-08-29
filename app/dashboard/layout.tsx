import { DashboardShell } from "@/components/admin/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Dashboard | Covers&All Admin",
  description: "Covers&All chat admin console.",
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-theme">
      <DashboardShell user={user}>{children}</DashboardShell>
    </div>
  );
}
