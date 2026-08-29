"use client";

import { CreateCustomerForm } from "@/components/admin/customers/CreateCustomerForm";
import type { CreateCustomerFormValues } from "@/components/admin/customers/CreateCustomerForm";
import { RecentCustomersPanel } from "@/components/admin/customers/RecentCustomersPanel";
import { ResetPasswordModal } from "@/components/admin/customers/ResetPasswordModal";
import {
  INITIAL_RECENT_CUSTOMERS,
  createCustomerRecord,
  type RecentCustomer,
} from "@/lib/admin/customers-data";
import { useCallback, useState } from "react";

export function CreateCustomerSection() {
  const [customers, setCustomers] = useState(INITIAL_RECENT_CUSTOMERS);
  const [resetTarget, setResetTarget] = useState<RecentCustomer | null>(null);

  const handleCreateCustomer = useCallback(
    async (values: CreateCustomerFormValues) => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setCustomers((current) => [
        createCustomerRecord(values.fullName, values.email, current.length),
        ...current,
      ]);
    },
    [],
  );

  const handleResetPassword = useCallback(
    async (customerId: string, _password: string) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      void customerId;
      // Password reset API will be wired in a later phase.
    },
    [],
  );

  const handleToggleBlock = useCallback((customerId: string) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? { ...customer, blocked: !customer.blocked }
          : customer,
      ),
    );
  }, []);

  const handleCancel = useCallback(() => {
    window.history.back();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <CreateCustomerForm
          onSubmit={handleCreateCustomer}
          onCancel={handleCancel}
        />
        <RecentCustomersPanel
          customers={customers}
          onResetPassword={setResetTarget}
          onToggleBlock={handleToggleBlock}
        />
      </div>

      <ResetPasswordModal
        open={resetTarget !== null}
        customer={resetTarget}
        onClose={() => setResetTarget(null)}
        onSubmit={handleResetPassword}
      />
    </>
  );
}
