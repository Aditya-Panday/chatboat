"use client";

import { AdminLogo } from "@/components/admin/login/AdminLogo";
import { ClientApiError } from "@/lib/api/client";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const json = await response.json();

      if (!json.success) {
        setError(json.error?.message ?? "Unable to sign in.");
        return;
      }

      router.replace(json.data?.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof ClientApiError) {
        setError(submitError.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <AdminLogo size="md" showLabel />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-[15px]">
            Please enter your details to access the Covers&All Admin console.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="admin@coversandall.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-[var(--covers-blue-soft)] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pr-11 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-[var(--covers-blue-soft)] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--covers-blue)] text-sm font-semibold text-white transition hover:bg-[var(--covers-blue-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--covers-blue)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in…" : "Login"}
            {!isSubmitting ? (
              <ArrowRight className="h-4 w-4" aria-hidden />
            ) : null}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400 lg:hidden">
        Covers&All Chat Admin Panel © {new Date().getFullYear()}
      </p>
    </div>
  );
}
