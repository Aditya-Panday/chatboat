import {
  loadDashboardOverviewStats,
  loadDashboardStats,
  loadRecentChats,
} from "@/lib/admin/dashboard-server";
import { StatsGrid } from "@/components/admin/dashboard/StatsGrid";
import { RecentChatsPanel } from "@/components/admin/dashboard/RecentChatsPanel";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";

export async function StatsGridServer() {
  const stats = await loadDashboardStats();
  return <StatsGrid stats={stats ?? []} />;
}

export async function OverviewStatsGridServer() {
  const stats = await loadDashboardOverviewStats();
  if (!stats?.length) return null;
  return <StatsGrid stats={stats} />;
}

export async function RecentChatsServer() {
  const user = await getCurrentUser();
  const chats = await loadRecentChats();
  return (
    <RecentChatsPanel chats={chats} canAssign={user ? isAdmin(user) : false} />
  );
}
