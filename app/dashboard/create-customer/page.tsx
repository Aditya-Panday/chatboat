import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";

const CreateCustomerSection = dynamic(
  () =>
    import("@/components/admin/customers/CreateCustomerSection").then(
      (module) => module.CreateCustomerSection,
    ),
  { loading: () => <CreateCustomerSkeleton /> },
);

function CreateCustomerSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <div className="h-[520px] animate-pulse rounded-xl bg-slate-200/70" />
      <div className="h-[360px] animate-pulse rounded-xl bg-slate-200/70" />
    </div>
  );
}

export default async function CreateCustomerPage() {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <CreateCustomerSection />
    </div>
  );
}
