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
import { createInvoiceAction } from "@/lib/actions";
import { calculateInvoiceTotals } from "@/lib/gst";
import type { BusinessProfile, Customer, Product } from "@/lib/types";
import { invoiceSchema } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";

type FormValues = z.infer<typeof invoiceSchema>;

export function InvoiceBuilder({
  businessProfile,
  customers,
  products,
}: {
  businessProfile: BusinessProfile;
  customers: Customer[];
  products: Product[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
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
        {
          item_name: "",
          description: "",
          hsn_sac_code: "",
          quantity: 1,
          unit: "Nos",
          rate: 0,
          gst_rate: 18,
          discount_percent: 0,
          discount_amount: 0,
        },
      ],
    },
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
  }, [
    amountPaid,
    businessProfile.state_code,
    documentType,
    flatDiscount,
    items,
    selectedCustomer?.state_code,
  ]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const invoiceId = await createInvoiceAction(values);
        toast.success(values.mode === "draft" ? "Draft saved." : "Invoice created.");
        if (typeof window !== "undefined" && invoiceId) {
          window.location.href = `/invoices/${invoiceId}`;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create invoice.");
      }
    });
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    }
    router.push("/dashboard");
  };

  const createWithAction = (values: FormValues, action?: "download" | "print") => {
    startTransition(async () => {
      try {
        const invoiceId = await createInvoiceAction(values);
        toast.success(values.mode === "draft" ? "Draft saved." : "Invoice created.");
        if (typeof window !== "undefined" && invoiceId) {
          const suffix = action ? `?auto=${action}` : "";
          window.location.href = `/invoices/${invoiceId}${suffix}`;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create invoice.");
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
            <FormField label="Received upfront">
              <Input type="number" step="0.01" {...form.register("amount_paid", { valueAsNumber: true })} />
            </FormField>
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
                    <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <FormField label="Preset item">
                        <Select
                          placeholder="Select from catalog"
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
                            form.setValue(`items.${index}.gst_rate`, selected.default_gst_rate);
                          }}
                        />
                      </FormField>
                      <FormField label="Item name">
                        <Input {...form.register(`items.${index}.item_name`)} />
                      </FormField>
                      <FormField label="HSN / SAC">
                        <Input {...form.register(`items.${index}.hsn_sac_code`)} />
                      </FormField>
                      <FormField label="Unit">
                        <Input {...form.register(`items.${index}.unit`)} />
                      </FormField>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                      <FormField label="Qty">
                        <Input type="number" step={1} min={0} {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                      </FormField>
                      <FormField label="Rate">
                        <Input type="number" step="0.01" {...form.register(`items.${index}.rate`, { valueAsNumber: true })} />
                      </FormField>
                      <FormField label="GST %">
                        <Select
                          options={GST_OPTIONS.map((value) => ({ label: `${value}%`, value: String(value) }))}
                          value={String(form.watch(`items.${index}.gst_rate`))}
                          onChange={(event) =>
                            form.setValue(`items.${index}.gst_rate`, Number(event.target.value), {
                              shouldDirty: true,
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Discount %">
                        <Input type="number" step="0.01" {...form.register(`items.${index}.discount_percent`, { valueAsNumber: true })} />
                      </FormField>
                      <FormField label="Flat discount">
                        <Input type="number" step="0.01" {...form.register(`items.${index}.discount_amount`, { valueAsNumber: true })} />
                      </FormField>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    <FormField label="Description" className="mt-3">
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={form.handleSubmit((values) => createWithAction({ ...values, mode: "draft" }))}
                disabled={pending}
              >
                Save draft
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Publishing..." : "Create document"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={form.handleSubmit((values) => createWithAction(values, "download"))}
              >
                Create & download PDF
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={form.handleSubmit((values) => createWithAction(values, "print"))}
              >
                Create & print
              </Button>
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
