"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_MODES } from "@/lib/constants";
import { recordPaymentAction } from "@/lib/actions";
import { paymentSchema } from "@/lib/validations";

type FormValues = z.infer<typeof paymentSchema>;

export function PaymentForm({
  invoiceId,
  maxAmount,
  onSuccess,
}: {
  invoiceId: string;
  maxAmount: number;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: invoiceId,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_mode: "upi",
      transaction_reference: "",
      amount: maxAmount,
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await recordPaymentAction(values);
        toast.success("Payment recorded.");
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to record payment.");
      }
    });
  };

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Payment date">
          <Input type="date" {...form.register("payment_date")} />
        </FormField>
        <FormField label="Mode">
          <Select
            options={PAYMENT_MODES.map((mode) => ({
              label: mode.replace("_", " ").toUpperCase(),
              value: mode,
            }))}
            value={form.watch("payment_mode")}
            onChange={(event) =>
              form.setValue("payment_mode", event.target.value as FormValues["payment_mode"], {
                shouldDirty: true,
              })
            }
          />
        </FormField>
        <FormField label="Amount" error={form.formState.errors.amount?.message}>
          <Input type="number" step="0.01" max={maxAmount} {...form.register("amount", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Transaction reference">
          <Input {...form.register("transaction_reference")} />
        </FormField>
        <FormField label="Notes" className="md:col-span-2">
          <Textarea {...form.register("notes")} />
        </FormField>
      </div>
      <Button type="submit" className="w-full" disabled={pending || maxAmount <= 0}>
        {pending ? "Saving..." : maxAmount <= 0 ? "No balance due" : "Record payment"}
      </Button>
    </form>
  );
}
