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
import { GST_OPTIONS, UNIT_OPTIONS } from "@/lib/constants";
import { upsertProductAction } from "@/lib/actions";
import type { Product } from "@/lib/types";
import { productSchema } from "@/lib/validations";

type FormValues = z.infer<typeof productSchema>;

function resolveUnit(unit: string | undefined | null): string {
  if (!unit) return "NOS";
  const match = UNIT_OPTIONS.find((o) => o.value === unit.toUpperCase());
  return match ? match.value : "OTH";
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
}: {
  product?: Product | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product?.id,
      item_name: product?.item_name ?? "",
      hsn_sac_code: product?.hsn_sac_code ?? "",
      hsn_code: product?.hsn_code ?? "",
      default_gst_rate: product?.default_gst_rate ?? 18,
      unit: resolveUnit(product?.unit),
      rate: product?.rate ?? 0,
      description: product?.description ?? "",
      item_type: product?.item_type ?? "service",
    },
  });

  useEffect(() => {
    form.reset({
      id: product?.id,
      item_name: product?.item_name ?? "",
      hsn_sac_code: product?.hsn_sac_code ?? "",
      hsn_code: product?.hsn_code ?? "",
      default_gst_rate: product?.default_gst_rate ?? 18,
      unit: resolveUnit(product?.unit),
      rate: product?.rate ?? 0,
      description: product?.description ?? "",
      item_type: product?.item_type ?? "service",
    });
  }, [product]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await upsertProductAction(values);
        toast.success(product ? "Product updated." : "Product added.");
        onSuccess?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save product.");
      }
    });
  };

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Item name" error={form.formState.errors.item_name?.message}>
          <Input {...form.register("item_name")} />
        </FormField>

        <div className="space-y-2">
          <FormField label="HSN / SAC Code">
            <Input
              {...form.register("hsn_code", { maxLength: 8 })}
              placeholder="e.g. 27101900"
              maxLength={8}
            />
          </FormField>
          <p className="text-xs text-muted-foreground">
            Required for GST invoices uploaded to government portal
          </p>
        </div>

        <FormField label="Default GST %">
          <Select
            options={GST_OPTIONS.map((value) => ({ label: `${value}%`, value: String(value) }))}
            value={String(form.watch("default_gst_rate"))}
            onChange={(event) =>
              form.setValue("default_gst_rate", Number(event.target.value), { shouldDirty: true })
            }
          />
        </FormField>

        <FormField label="Unit">
          <Select
            options={UNIT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            value={form.watch("unit")}
            onChange={(event) =>
              form.setValue("unit", event.target.value, { shouldDirty: true })
            }
          />
        </FormField>

        <FormField label="Rate">
          <Input type="number" step="0.01" {...form.register("rate", { valueAsNumber: true })} />
        </FormField>

        <FormField label="Goods / service">
          <Select
            options={[
              { label: "Service", value: "service" },
              { label: "Goods", value: "goods" },
            ]}
            value={form.watch("item_type")}
            onChange={(event) =>
              form.setValue("item_type", event.target.value as "goods" | "service", {
                shouldDirty: true,
              })
            }
          />
        </FormField>

        <FormField label="Description" className="md:col-span-2">
          <Textarea {...form.register("description")} />
        </FormField>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Saving..." : product ? "Update item" : "Create item"}
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
