"use client";

import { CreateCustomerForm } from "@/components/admin/customers/CreateCustomerForm";
import type { CreateCustomerFormValues } from "@/components/admin/customers/CreateCustomerForm";
import { RecentCustomersPanel } from "@/components/admin/customers/RecentCustomersPanel";
import type { ResetUserPayload } from "@/components/admin/customers/ResetPasswordModal";
import { ResetPasswordModal } from "@/components/admin/customers/ResetPasswordModal";
import { apiFetch, apiFetchList, ClientApiError } from "@/lib/api/client";
import { getInitials, pickAvatarClass } from "@/lib/admin/customers-data";
import type { RecentCustomer } from "@/lib/admin/customers-data";
import { useCallback, useEffect, useState } from "react";

type ApiUserListItem = {
  id: string;
  name: string;
  email: string | null;
  userType: "CUSTOMER" | "STAFF";
  isActive: boolean;
  roles: Array<{ id: string; name: string; description: string | null }>;
};

function mapApiUser(user: ApiUserListItem, index: number): RecentCustomer {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? "",
    role:
      user.roles[0]?.name ??
      (user.userType === "CUSTOMER" ? "Customer" : "Staff"),
    initials: getInitials(user.name),
    avatarClassName: pickAvatarClass(index),
    blocked: !user.isActive,
  };
}

export function CreateCustomerSection() {
  const [customers, setCustomers] = useState<RecentCustomer[]>([]);
  const [resetTarget, setResetTarget] = useState<RecentCustomer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    try {
      const result = await apiFetchList<ApiUserListItem>(
        "/api/users?limit=10&page=1",
      );
      setCustomers(result.data.map(mapApiUser));
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof ClientApiError
          ? error.message
          : "Unable to load recent users.",
      );
    }
  }, []);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  const handleCreateCustomer = useCallback(
    async (values: Omit<CreateCustomerFormValues, "confirmPassword">) => {
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: values.fullName,
          email: values.email,
          password: values.password,
          userType: "STAFF",
          role: values.role,
        }),
      });
      await refreshUsers();
    },
    [refreshUsers],
  );

  const handleResetUser = useCallback(
    async (customerId: string, payload: ResetUserPayload) => {
      await apiFetch(`/api/users/${customerId}/password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword: payload.password }),
      });

      const target = customers.find((customer) => customer.id === customerId);
      if (target && target.role !== "Customer" && payload.role !== target.role) {
        await apiFetch(`/api/users/${customerId}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: payload.role }),
        });
      }

      await refreshUsers();
    },
    [customers, refreshUsers],
  );

  const handleToggleBlock = useCallback(
    async (customerId: string) => {
      const target = customers.find((customer) => customer.id === customerId);
      if (!target) return;

      await apiFetch(`/api/users/${customerId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: target.blocked }),
      });
      await refreshUsers();
    },
    [customers, refreshUsers],
  );

  const handleDelete = useCallback(
    async (customer: RecentCustomer) => {
      const confirmed = window.confirm(
        `Delete ${customer.name}? This cannot be undone.`,
      );
      if (!confirmed) return;

      try {
        await apiFetch(`/api/users/${customer.id}`, { method: "DELETE" });
        await refreshUsers();
      } catch (error) {
        window.alert(
          error instanceof ClientApiError
            ? error.message
            : "Unable to delete user.",
        );
      }
    },
    [refreshUsers],
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <CreateCustomerForm onSubmit={handleCreateCustomer} />
        <RecentCustomersPanel
          customers={customers}
          loadError={loadError}
          onResetPassword={setResetTarget}
          onToggleBlock={handleToggleBlock}
          onDelete={handleDelete}
        />
      </div>

      <ResetPasswordModal
        open={resetTarget !== null}
        customer={resetTarget}
        onClose={() => setResetTarget(null)}
        onSubmit={handleResetUser}
      />
    </>
  );
}
