import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminLoginShell } from "@/components/admin/login/AdminLoginShell";
import { LoginFormSkeleton } from "@/components/admin/login/LoginFormSkeleton";
import dynamic from "next/dynamic";

const AdminLoginForm = dynamic(
  () =>
    import("@/components/admin/login/AdminLoginForm").then(
      (module) => module.AdminLoginForm,
    ),
  { loading: () => <LoginFormSkeleton /> },
);

const AdminLoginBranding = dynamic(
  () =>
    import("@/components/admin/login/AdminLoginBranding").then(
      (module) => module.AdminLoginBranding,
    ),
  { loading: () => null },
);

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <AdminLoginShell
      form={<AdminLoginForm />}
      branding={<AdminLoginBranding />}
    />
  );
}
