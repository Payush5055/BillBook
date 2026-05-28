"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { STATE_CODES } from "@/lib/constants";
import type { BusinessProfile } from "@/lib/types";
import { businessProfileSchema } from "@/lib/validations";
import { uploadBrandAssetAction, upsertBusinessProfileAction } from "@/lib/actions";

type FormValues = z.infer<typeof businessProfileSchema>;

export function BusinessProfileForm({
  profile,
  userId,
}: {
  profile: BusinessProfile | null;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [uploadingField, setUploadingField] = useState<"logo_url" | "signature_url" | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      business_name: profile?.business_name ?? "",
      address: profile?.address ?? "",
      gstin: profile?.gstin ?? "27FODPP3712Q1ZD",
      state: profile?.state ?? "Maharashtra",
      state_code: profile?.state_code ?? "27",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      bank_account_name: profile?.bank_account_name ?? "",
      bank_name: profile?.bank_name ?? "",
      bank_account_number: profile?.bank_account_number ?? "",
      bank_ifsc: profile?.bank_ifsc ?? "",
      upi_id: profile?.upi_id ?? "",
      terms_and_conditions: profile?.terms_and_conditions ?? "Payment due within agreed terms. Goods once sold will not be taken back.",
      invoice_prefix: profile?.invoice_prefix ?? "SSP",
      financial_year_lock_before: profile?.financial_year_lock_before ?? "",
      logo_url: profile?.logo_url ?? "",
      signature_url: profile?.signature_url ?? "",
    },
  });

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "logo_url" | "signature_url",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    setUploadingField(field);
    try {
      const publicUrl = await uploadBrandAssetAction(formData);
      form.setValue(field, publicUrl, { shouldDirty: true });
      toast.success(field === "logo_url" ? "Logo uploaded." : "Signature uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingField(null);
    }
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await upsertBusinessProfileAction(values);
        toast.success("Business profile saved.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save profile.");
      }
    });
  };

  return (
    <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Business name" error={form.formState.errors.business_name?.message}>
          <Input {...form.register("business_name")} placeholder="Studio, agency, consultant..." />
        </FormField>
        <FormField label="GSTIN" error={form.formState.errors.gstin?.message}>
          <Input {...form.register("gstin")} placeholder="27FODPP3712Q1ZD" />
        </FormField>
        <FormField label="Address" error={form.formState.errors.address?.message} className="md:col-span-2">
          <Textarea {...form.register("address")} />
        </FormField>
        <FormField label="State" error={form.formState.errors.state?.message}>
          <Input {...form.register("state")} />
        </FormField>
        <FormField label="State code" error={form.formState.errors.state_code?.message}>
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
          <Input {...form.register("phone")} placeholder="+91..." />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email?.message}>
          <Input {...form.register("email")} type="email" placeholder="billing@business.com" />
        </FormField>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Bank account name">
          <Input {...form.register("bank_account_name")} />
        </FormField>
        <FormField label="Bank name">
          <Input {...form.register("bank_name")} />
        </FormField>
        <FormField label="Account number">
          <Input {...form.register("bank_account_number")} />
        </FormField>
        <FormField label="IFSC code">
          <Input {...form.register("bank_ifsc")} />
        </FormField>
        <FormField label="UPI ID">
          <Input {...form.register("upi_id")} placeholder="yourname@upi" />
        </FormField>
        <FormField label="Invoice prefix" error={form.formState.errors.invoice_prefix?.message}>
          <Input {...form.register("invoice_prefix")} placeholder="SSP" />
        </FormField>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Logo upload">
          <Input type="file" accept="image/*" onChange={(event) => handleUpload(event, "logo_url")} />
          {uploadingField === "logo_url" ? <p className="text-xs text-muted-foreground">Uploading logo...</p> : null}
          {form.watch("logo_url") ? <p className="text-xs text-emerald-300">Logo ready in storage.</p> : null}
        </FormField>
        <FormField label="Digital signature upload">
          <Input type="file" accept="image/*" onChange={(event) => handleUpload(event, "signature_url")} />
          {uploadingField === "signature_url" ? <p className="text-xs text-muted-foreground">Uploading signature...</p> : null}
          {form.watch("signature_url") ? <p className="text-xs text-emerald-300">Signature ready in storage.</p> : null}
        </FormField>
        <FormField label="Financial year lock before">
          <Input type="date" {...form.register("financial_year_lock_before")} />
        </FormField>
        <FormField label="Terms & conditions" className="md:col-span-2">
          <Textarea {...form.register("terms_and_conditions")} />
        </FormField>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving..." : "Save business profile"}
      </Button>
    </form>
  );
}
