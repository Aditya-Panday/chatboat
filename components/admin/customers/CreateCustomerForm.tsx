"use client";

import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";

export type CreateCustomerFormValues = {
  fullName: string;
  email: string;
  password: string;
};

type CreateCustomerFormProps = {
  onSubmit: (values: CreateCustomerFormValues) => Promise<void>;
  onCancel: () => void;
};

const INITIAL_VALUES: CreateCustomerFormValues = {
  fullName: "",
  email: "",
  password: "",
};

export function CreateCustomerForm({
  onSubmit,
  onCancel,
}: CreateCustomerFormProps) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const fullName = values.fullName.trim();
    const email = values.email.trim().toLowerCase();

    if (!fullName || !email || !values.password) {
      setError("All fields are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (values.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ fullName, email, password: values.password });
      setValues(INITIAL_VALUES);
      setShowPassword(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create customer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Create New Customer
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add a new customer account to the system.
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Field
          id="customer-full-name"
          label="Full Name"
          placeholder="e.g. Jane Doe"
          value={values.fullName}
          onChange={(value) => setValues((current) => ({ ...current, fullName: value }))}
          disabled={isSubmitting}
          autoComplete="name"
        />

        <Field
          id="customer-email"
          label="Email Address"
          type="email"
          placeholder="jane@example.com"
          value={values.email}
          onChange={(value) => setValues((current) => ({ ...current, email: value }))}
          disabled={isSubmitting}
          autoComplete="email"
        />

        <div>
          <label
            htmlFor="customer-password"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="customer-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={values.password}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              disabled={isSubmitting}
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

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-lg bg-[var(--covers-blue)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--covers-blue-dark)] disabled:opacity-60"
          >
            {isSubmitting ? "Creating…" : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  autoComplete?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-[var(--covers-blue-soft)] disabled:opacity-60"
      />
    </div>
  );
}
