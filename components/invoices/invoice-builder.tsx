"use client";

import { useMemo, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_TYPES, GST_OPTIONS } from "@/lib/constants";
import { createInvoiceAction, updateInvoiceAction } from "@/lib/actions";
import { calculateInvoiceTotals } from "@/lib/gst";
import type { BusinessProfile, Customer, InvoiceDetailRecord, Product } from "@/lib/types";
import { invoiceSchema } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";

type FormValues = z.infer<typeof invoiceSchema>;

function buildDefaultValues(
  customers: Customer[],
  existingInvoice?: InvoiceDetailRecord | null,
): FormValues {
  if (existingInvoice) {
    const items = [...(existingInvoice.invoice_items ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      customer_id: existingInvoice.customer_id,
      document_type: existingInvoice.document_type as FormValues["document_type"],
      issue_date: existingInvoice.issue_date,
      due_date: existingInvoice.due_date ?? "",
      payment_terms: existingInvoice.payment_terms ?? "Due on receipt",
      notes: existingInvoice.notes ?? "",
      remarks: existingInvoice.remarks ?? "",
      flat_discount: existingInvoice.invoice_discount_total,
      amount_paid: existingInvoice.amount_paid,
      mode: "publish",
      source_invoice_id: existingInvoice.source_invoice_id ?? null,
      items: items.length
        ? items.map((item) => ({
            product_id: item.product_id ?? null,
            item_name: item.item_name,
            description: item.description ?? "",
            hsn_sac_code: item.hsn_sac_code ?? "",
            quantity: Number(item.quantity),
            unit: item.unit,
            rate: Number(item.rate),
            gst_rate: Number(item.gst_rate),
            discount_percent: Number(item.discount_percent),
            discount_amount: Number(item.discount_amount),
          }))
        : [{ item_name: "", description: "", hsn_sac_code: "", quantity: 1, unit: "Nos", rate: 0, gst_rate: 18, discount_percent: 0, discount_amount: 0 }],
    };
  }

  return {
    customer_id: customers[0]?.id ?? "",
    document_type: "gst_invoice",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    payment_terms: "Due on receipt",
    notes: "",
    remarks: "",
    flat_discount: 0,
    amount_paid: 0,
    mode: "publish",
    source_invoice_id: null,
    items: [
      { item_name: "", description: "", hsn_sac_code: "", quantity: 1, unit: "Nos", rate: 0, gst_rate: 18, discount_percent: 0, discount_amount: 0 },
    ],
  };
}

export function InvoiceBuilder({
  businessProfile,
  customers,
  products,
  existingInvoice,
}: {
  businessProfile: BusinessProfile;
  customers: Customer[];
  products: Product[];
  existingInvoice?: InvoiceDetailRecord | null;
}) {
  const router = useRouter();
  const isEditMode = !!existingInvoice;
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: buildDefaultValues(customers, existingInvoice),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedCustomerId = form.watch("customer_id");
  const documentType = form.watch("document_type");
  const flatDiscount = form.watch("flat_discount");
  const amountPaid = form.watch("amount_paid");
  const items = form.watch("items");
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);

  const totals = useMemo(() => {
    return calculateInvoiceTotals({
      businessStateCode: businessProfile.state_code,
      customerStateCode: selectedCustomer?.state_code ?? businessProfile.state_code,
      documentType,
      items,
      flatDiscount,
      amountPaid,
    });
  }, [amountPaid, businessProfile.state_code, documentType, flatDiscount, items, selectedCustomer?.state_code]);

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    }
    router.push(isEditMode ? `/invoices/${existingInvoice!.id}` : "/dashboard");
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        if (isEditMode) {
          await updateInvoiceAction(existingInvoice!.id, values);
          toast.success("Invoice updated.");
          router.push(`/invoices/${existingInvoice!.id}`);
        } else {
          const invoiceId = await createInvoiceAction(values);
          toast.success(values.mode === "draft" ? "Draft saved." : "Invoice created.");
          if (invoiceId) window.location.href = `/invoices/${invoiceId}`;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save invoice.");
      }
    });
  };

  const createWithAction = (values: FormValues, action?: "download" | "print") => {
    startTransition(async () => {
      try {
        if (isEditMode) {
          await updateInvoiceAction(existingInvoice!.id, values);
          toast.success("Invoice updated.");
          const suffix = action ? `?auto=${action}` : "";
          window.location.href = `/invoices/${existingInvoice!.id}${suffix}`;
        } else {
          const invoiceId = await createInvoiceAction(values);
          toast.success(values.mode === "draft" ? "Draft saved." : "Invoice created.");
          if (invoiceId) {
            const suffix = action ? `?auto=${action}` : "";
            window.location.href = `/invoices/${invoiceId}${suffix}`;
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save invoice.");
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Document type">
              <Select
                options={DOCUMENT_TYPES.map((item) => ({ label: item.label, value: item.value }))}
                value={form.watch("document_type")}
                onChange={(event) =>
                  form.setValue("document_type", event.target.value as FormValues["document_type"], {
                    shouldDirty: true,
                  })
                }
              />
            </FormField>
            <FormField label="Customer">
              <Select
                options={customers.map((customer) => ({
                  label: `${customer.customer_name} • ${customer.state_code}`,
                  value: customer.id,
                }))}
                value={form.watch("customer_id")}
                onChange={(event) => form.setValue("customer_id", event.target.value, { shouldDirty: true })}
              />
            </FormField>
            <FormField label="Issue date">
              <Input type="date" {...form.register("issue_date")} />
            </FormField>
            <FormField label="Due date">
              <Input type="date" {...form.register("due_date")} />
            </FormField>
            <FormField label="Payment terms">
              <Input {...form.register("payment_terms")} />
            </FormField>
            {!isEditMode && (
              <FormField label="Received upfront">
                <Input type="number" step="0.01" {...form.register("amount_paid", { valueAsNumber: true })} />
              </FormField>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Invoice items</h3>
                <p className="text-sm text-muted-foreground">
                  Live GST split updates instantly as you edit quantity, rate, or place of supply.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  append({
                    item_name: "",
                    description: "",
                    hsn_sac_code: "",
                    quantity: 1,
                    unit: "Nos",
                    rate: 0,
                    gst_rate: 18,
                    discount_percent: 0,
                    discount_amount: 0,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add item
              </Button>
            </div>

            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    {/* Row 1: Preset item | Item name | HSN/SAC | Trash */}
                    <div className="mb-3 flex items-end gap-3">
                      <FormField label="Preset item" className="w-36 flex-none">
                        <Select
                          placeholder="From catalog"
                          options={products.map((product) => ({
                            label: `${product.item_name} • ${formatCurrency(product.rate)}`,
                            value: product.id,
                          }))}
                          onChange={(event) => {
                            const selected = products.find((product) => product.id === event.target.value);
                            if (!selected) return;
                            form.setValue(`items.${index}.product_id`, selected.id);
                            form.setValue(`items.${index}.item_name`, selected.item_name);
                            form.setValue(`items.${index}.description`, selected.description ?? "");
                            form.setValue(`items.${index}.hsn_sac_code`, selected.hsn_sac_code ?? "");
                            form.setValue(`items.${index}.rate`, selected.rate);
                            form.setValue(`items.${index}.unit`, selected.unit);
                            form.setValue(`items.${index}.gst_rate`, Number(selected.default_gst_rate));
                          }}
                        />
                      </FormField>
                      <FormField label="Item name" className="flex-1 min-w-0">
                        <Input className="h-9" placeholder="Goods / service description" {...form.register(`items.${index}.item_name`)} />
                      </FormField>
                      <FormField label="HSN / SAC" className="w-28 flex-none">
                        <Input className="h-9" placeholder="e.g. 9983" {...form.register(`items.${index}.hsn_sac_code`)} />
                      </FormField>
                      <button
                        type="button"
                        className="mb-1 self-end text-red-400/60 transition-colors hover:text-red-400 disabled:opacity-30"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Row 2: Unit | Qty | Rate | GST % */}
                    <div className="mb-3 grid grid-cols-4 gap-3">
                      <FormField label="Unit">
                        <Input className="h-9" placeholder="Nos" {...form.register(`items.${index}.unit`)} />
                      </FormField>
                      <FormField label="Qty">
                        <Input className="h-9" type="number" step={1} min={0} {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                      </FormField>
                      <FormField label="Rate ₹">
                        <Input className="h-9" type="number" step="0.01" min={0} {...form.register(`items.${index}.rate`, { valueAsNumber: true })} />
                      </FormField>
                      <FormField label="GST %">
                        <select
                          className="h-9 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                          value={form.watch(`items.${index}.gst_rate`) ?? 18}
                          onChange={(e) =>
                            form.setValue(`items.${index}.gst_rate`, Number(e.target.value))
                          }
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </FormField>
                    </div>

                    {/* Row 3: Discount % | Flat discount ₹ */}
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <FormField label="Discount %">
                        <Input className="h-9" type="number" step="0.01" min={0} max={100} placeholder="0" {...form.register(`items.${index}.discount_percent`, { valueAsNumber: true })} />
                      </FormField>
                      <FormField label="Flat discount ₹">
                        <Input className="h-9" type="number" step="0.01" min={0} placeholder="0" {...form.register(`items.${index}.discount_amount`, { valueAsNumber: true })} />
                      </FormField>
                    </div>

                    {/* Row 4: Description */}
                    <FormField label="Description">
                      <Textarea {...form.register(`items.${index}.description`)} className="min-h-[80px]" />
                    </FormField>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/15 p-3">
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Live summary</h3>
                <p className="text-sm text-muted-foreground">
                  {totals.isInterState ? "Inter-state • IGST" : "Intra-state • CGST + SGST"}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={totals.subtotal} />
              <SummaryRow label="Item discounts" value={totals.itemDiscountTotal} negative />
              <FormField label="Invoice flat discount">
                <Input type="number" step="0.01" {...form.register("flat_discount", { valueAsNumber: true })} />
              </FormField>
              <SummaryRow label="Taxable amount" value={totals.taxableAmount} />
              <SummaryRow label="CGST" value={totals.cgstTotal} />
              <SummaryRow label="SGST" value={totals.sgstTotal} />
              <SummaryRow label="IGST" value={totals.igstTotal} />
              <SummaryRow label="Grand total" value={totals.grandTotal} strong />
              <SummaryRow label="Balance due" value={totals.amountDue} strong />
            </div>
          </Card>

          <Card className="space-y-4">
            <FormField label="Internal notes">
              <Textarea {...form.register("notes")} />
            </FormField>
            <FormField label="Remarks">
              <Textarea {...form.register("remarks")} />
            </FormField>
            {!isEditMode && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={form.handleSubmit((values) => createWithAction({ ...values, mode: "draft" }))}
                  disabled={pending}
                >
                  Save draft
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancel} disabled={pending}>
                  Cancel
                </Button>
              </div>
            )}
            <div className={`grid gap-3 ${isEditMode ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : isEditMode ? "Save changes" : "Create document"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={form.handleSubmit((values) => createWithAction(values, "download"))}
              >
                {isEditMode ? "Save & download PDF" : "Create & download PDF"}
              </Button>
              {!isEditMode && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={form.handleSubmit((values) => createWithAction(values, "print"))}
                >
                  Create & print
                </Button>
              )}
              {isEditMode && (
                <Button type="button" variant="ghost" onClick={handleCancel} disabled={pending}>
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

function SummaryRow({
  label,
  value,
  negative,
  strong,
}: {
  label: string;
  value: number;
  negative?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-semibold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={negative ? "text-rose-300" : "text-foreground"}>
        {negative ? "-" : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}
