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

export default function AdminLoginPage() {
  return (
    <AdminLoginShell
      form={<AdminLoginForm />}
      branding={<AdminLoginBranding />}
    />
  );
}
