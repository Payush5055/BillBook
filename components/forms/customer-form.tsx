"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { STATE_CODES } from "@/lib/constants";
import { upsertCustomerAction } from "@/lib/actions";
import type { Customer } from "@/lib/types";
import { customerSchema } from "@/lib/validations";

type FormValues = z.infer<typeof customerSchema>;

export function CustomerForm({
  customer,
  onSuccess,
  onCancel,
}: {
  customer?: Customer | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      id: customer?.id,
      customer_name: customer?.customer_name ?? "",
      gstin: customer?.gstin ?? "",
      address: customer?.address ?? "",
      state: customer?.state ?? "",
      state_code: customer?.state_code ?? "",
      place_of_supply: customer?.place_of_supply ?? "Maharashtra",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      notes: customer?.notes ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      id: customer?.id,
      customer_name: customer?.customer_name ?? "",
      gstin: customer?.gstin ?? "",
      address: customer?.address ?? "",
      state: customer?.state ?? "",
      state_code: customer?.state_code ?? "",
      place_of_supply: customer?.place_of_supply ?? "Maharashtra",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      notes: customer?.notes ?? "",
    });
  }, [customer]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await upsertCustomerAction(values);
        toast.success(customer ? "Customer updated." : "Customer added.");
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save customer.");
      }
    });
  };

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Customer name" error={form.formState.errors.customer_name?.message}>
          <Input {...form.register("customer_name")} />
        </FormField>
        <FormField label="GSTIN">
          <Input {...form.register("gstin")} placeholder="Optional for non-GST party" />
        </FormField>
        <FormField label="Address" className="md:col-span-2" error={form.formState.errors.address?.message}>
          <Textarea {...form.register("address")} />
        </FormField>
        <FormField label="State">
          <Input {...form.register("state")} />
        </FormField>
        <FormField label="State code">
          <Select
            options={STATE_CODES.map((state) => ({
              label: `${state.code} • ${state.name}`,
              value: state.code,
            }))}
            value={form.watch("state_code")}
            onChange={(event) => {
              const selected = STATE_CODES.find((state) => state.code === event.target.value);
              form.setValue("state_code", event.target.value, { shouldDirty: true });
              if (selected) form.setValue("state", selected.name, { shouldDirty: true });
            }}
          />
        </FormField>
        <FormField label="Phone">
          <Input {...form.register("phone")} />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} />
        </FormField>
        <FormField label="Place of supply">
          <Select
            options={STATE_CODES.map((s) => ({ label: `${s.code} • ${s.name}`, value: s.name }))}
            value={form.watch("place_of_supply") ?? "Maharashtra"}
            onChange={(event) =>
              form.setValue("place_of_supply", event.target.value, { shouldDirty: true })
            }
          />
        </FormField>
        <FormField label="Notes" className="md:col-span-2">
          <Textarea {...form.register("notes")} />
        </FormField>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Saving..." : customer ? "Update customer" : "Create customer"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (form.formState.isDirty) {
              if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
            }
            onCancel?.();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
