"use client";

import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export type AssignableRole = {
  id: string;
  name: string;
  description: string | null;
};

export type CreateCustomerFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

type CreateCustomerFormProps = {
  onSubmit: (values: Omit<CreateCustomerFormValues, "confirmPassword">) => Promise<void>;
};

const INITIAL_VALUES: CreateCustomerFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "AGENT",
};

export function CreateCustomerForm({ onSubmit }: CreateCustomerFormProps) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AssignableRole[]>("/api/roles")
      .then((data) => {
        setRoles(data);
        if (data[0]?.name) {
          setValues((current) => ({ ...current, role: data[0].name }));
        }
      })
      .catch(() => setRoles([]));
  }, []);

  const resetForm = useCallback(() => {
    setValues({
      ...INITIAL_VALUES,
      role: roles[0]?.name ?? "AGENT",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setSuccess(null);
  }, [roles]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const fullName = values.fullName.trim();
    const email = values.email.trim().toLowerCase();

    if (!fullName || !email || !values.password || !values.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    if (!values.role) {
      setError("Select a role.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        fullName,
        email,
        password: values.password,
        role: values.role,
      });
      resetForm();
      setSuccess("User created successfully.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create user.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Create New User
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add a new staff account with email, password, and role.
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Field
          id="customer-full-name"
          label="Full Name"
          placeholder="e.g. Jane Doe"
          value={values.fullName}
          onChange={(value) =>
            setValues((current) => ({ ...current, fullName: value }))
          }
          disabled={isSubmitting}
          autoComplete="name"
        />

        <Field
          id="customer-email"
          label="Email Address"
          type="email"
          placeholder="jane@example.com"
          value={values.email}
          onChange={(value) =>
            setValues((current) => ({ ...current, email: value }))
          }
          disabled={isSubmitting}
          autoComplete="email"
        />

        <PasswordField
          id="customer-password"
          label="Password"
          value={values.password}
          visible={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
          onChange={(value) =>
            setValues((current) => ({ ...current, password: value }))
          }
          disabled={isSubmitting}
          autoComplete="new-password"
          hint="Minimum 8 characters with upper, lower, and number."
        />

        <PasswordField
          id="customer-confirm-password"
          label="Confirm Password"
          value={values.confirmPassword}
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((current) => !current)}
          onChange={(value) =>
            setValues((current) => ({ ...current, confirmPassword: value }))
          }
          disabled={isSubmitting}
          autoComplete="new-password"
        />

        <div>
          <label
            htmlFor="staff-role"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Role
          </label>
          <select
            id="staff-role"
            value={values.role}
            onChange={(event) =>
              setValues((current) => ({ ...current, role: event.target.value }))
            }
            disabled={isSubmitting || roles.length === 0}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-[var(--covers-blue-soft)]"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-lg bg-[var(--covers-blue)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--covers-blue-dark)] disabled:opacity-60"
          >
            {isSubmitting ? "Creating…" : "Create User"}
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

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
  hint?: string;
};

function PasswordField({
  id,
  label,
  value,
  visible,
  onToggle,
  onChange,
  disabled,
  autoComplete,
  hint,
}: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          disabled={disabled}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white pr-11 pl-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--covers-blue)] focus:ring-2 focus:ring-[var(--covers-blue-soft)] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
