import { getCurrentUser } from "@/lib/auth/session";

export async function DashboardWelcome() {
  const user = await getCurrentUser();
  const roleLabel = user?.roles[0]?.name ?? "Staff";

  return (
    <header>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Welcome, {user?.name ?? "Admin"} 👋
      </h2>
      <p className="mt-1 text-sm text-slate-500 sm:text-[15px]">
        Role: {roleLabel}. Here&apos;s what&apos;s happening with your chatbots
        today.
      </p>
    </header>
  );
}
