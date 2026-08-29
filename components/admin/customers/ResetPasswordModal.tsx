"use client";

import type { RecentCustomer } from "@/lib/admin/customers-data";
import { Eye, EyeOff, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type ResetPasswordModalProps = {
  open: boolean;
  customer: RecentCustomer | null;
  onClose: () => void;
  onSubmit: (customerId: string, password: string) => Promise<void>;
};

export function ResetPasswordModal({
  open,
  customer,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, isSubmitting]);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShowPassword(false);
      setError(null);
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open || !customer) return null;

  const activeCustomer = customer;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(activeCustomer.id, password);
      setSuccess(true);
      window.setTimeout(onClose, 900);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to reset password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
    >
      <button
        type="button"
        aria-label="Close reset password dialog"
        className="absolute inset-0 bg-slate-900/45"
        onClick={isSubmitting ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="reset-password-title"
              className="text-base font-semibold text-slate-900"
            >
              Reset Password
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">{customer.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4 px-5 py-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="reset-password-input"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="reset-password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter new password"
                disabled={isSubmitting || success}
                autoComplete="new-password"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pr-11 pl-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-[var(--covers-blue-soft)] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
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
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Password updated successfully.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || success}
            className="h-11 w-full rounded-lg bg-[var(--covers-blue)] text-sm font-semibold text-white transition hover:bg-[var(--covers-blue-dark)] disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
