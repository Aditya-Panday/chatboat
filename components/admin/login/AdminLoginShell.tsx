import type { ReactNode } from "react";

type AdminLoginShellProps = {
  form: ReactNode;
  branding: ReactNode;
};

export function AdminLoginShell({ form, branding }: AdminLoginShellProps) {
  return (
    <div className="admin-theme min-h-dvh bg-[var(--admin-page-bg)] lg:grid lg:grid-cols-2">
      <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8 lg:px-14 xl:px-20">
        {form}
      </section>

      <aside
        className="admin-panel-bg relative hidden lg:block"
        aria-label="Covers&All admin branding"
      >
        {branding}
      </aside>
    </div>
  );
}
