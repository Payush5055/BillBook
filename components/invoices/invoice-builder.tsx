"use client";

import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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

const PAYMENT_TERMS_OPTIONS = [
  { label: "CREDIT", value: "CREDIT" },
  { label: "CASH", value: "CASH" },
  { label: "ADVANCE", value: "ADVANCE" },
  { label: "AGAINST DELIVERY", value: "AGAINST DELIVERY" },
  { label: "30 DAYS", value: "30 DAYS" },
  { label: "45 DAYS", value: "45 DAYS" },
  { label: "60 DAYS", value: "60 DAYS" },
  { label: "90 DAYS", value: "90 DAYS" },
];

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
      payment_terms: existingInvoice.payment_terms ?? "CREDIT",
      notes: existingInvoice.notes ?? "",
      remarks: existingInvoice.remarks ?? "",
      flat_discount: existingInvoice.invoice_discount_total,
      amount_paid: existingInvoice.amount_paid,
      mode: "publish",
      source_invoice_id: existingInvoice.source_invoice_id ?? null,
      eway_bill_no: existingInvoice.eway_bill_no ?? "",
      suppliers_ref: existingInvoice.suppliers_ref ?? "",
      other_ref: existingInvoice.other_ref ?? "",
      buyer_order_no: existingInvoice.buyer_order_no ?? "",
      buyer_order_date: existingInvoice.buyer_order_date ?? "",
      dispatch_doc_no: existingInvoice.dispatch_doc_no ?? "",
      dispatch_date: existingInvoice.dispatch_date ?? "",
      dispatch_through: existingInvoice.dispatch_through ?? "",
      destination: existingInvoice.destination ?? "",
      consignee_name: existingInvoice.consignee_name ?? "",
      consignee_address: existingInvoice.consignee_address ?? "",
      consignee_gstin: existingInvoice.consignee_gstin ?? "",
      consignee_state_code: existingInvoice.consignee_state_code ?? null,
      // Leave declaration_text empty so document auto-generates dynamic version
      declaration_text: existingInvoice.declaration_text ?? "",
      show_receiver_signature: existingInvoice.show_receiver_signature ?? true,
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
        : [defaultItem()],
    };
  }

  return {
    customer_id: customers[0]?.id ?? "",
    document_type: "gst_invoice",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    payment_terms: "CREDIT",
    notes: "",
    remarks: "",
    flat_discount: 0,
    amount_paid: 0,
    mode: "publish",
    source_invoice_id: null,
    eway_bill_no: "",
    suppliers_ref: "",
    other_ref: "",
    buyer_order_no: "",
    buyer_order_date: "",
    dispatch_doc_no: "",
    dispatch_date: "",
    dispatch_through: "",
    destination: "",
    consignee_name: "",
    consignee_address: "",
    consignee_gstin: "",
    consignee_state_code: null,
    declaration_text: "",
    show_receiver_signature: true,
    items: [defaultItem()],
  };
}

function defaultItem() {
  return {
    item_name: "",
    description: "",
    hsn_sac_code: "",
    quantity: 1,
    unit: "NOS",
    rate: 0,
    gst_rate: 18,
    discount_percent: 0,
    discount_amount: 0,
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
  const [invalidHsnIndexes, setInvalidHsnIndexes] = useState<Set<number>>(new Set());
  const [additionalOpen, setAdditionalOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: buildDefaultValues(customers, existingInvoice),
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const selectedCustomerId = form.watch("customer_id");
  const documentType = form.watch("document_type");
  const flatDiscount = form.watch("flat_discount");
  const amountPaid = form.watch("amount_paid");
  const items = form.watch("items");
  const showReceiverSig = form.watch("show_receiver_signature");
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const totals = useMemo(
    () =>
      calculateInvoiceTotals({
        businessStateCode: businessProfile.state_code,
        customerStateCode: selectedCustomer?.state_code ?? businessProfile.state_code,
        documentType,
        items,
        flatDiscount,
        amountPaid,
      }),
    [amountPaid, businessProfile.state_code, documentType, flatDiscount, items, selectedCustomer?.state_code],
  );

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    }
    router.push(isEditMode ? `/invoices/${existingInvoice!.id}` : "/dashboard");
  };

  const validateGst = (values: FormValues): string | null => {
    if (values.document_type !== "gst_invoice") {
      setInvalidHsnIndexes(new Set());
      return null;
    }
    const customer = customers.find((c) => c.id === values.customer_id);
    if (!customer?.place_of_supply) {
      return `Cannot create GST invoice: Customer '${customer?.customer_name ?? ""}' is missing Place of Supply.`;
    }
    const badIndexes = new Set<number>();
    for (let i = 0; i < values.items.length; i++) {
      if (!values.items[i].hsn_sac_code?.trim()) badIndexes.add(i);
    }
    if (badIndexes.size > 0) {
      setInvalidHsnIndexes(badIndexes);
      const firstBad = values.items[badIndexes.values().next().value!];
      return `Cannot create GST invoice: '${firstBad.item_name || "unnamed item"}' is missing HSN/SAC code.`;
    }
    setInvalidHsnIndexes(new Set());
    return null;
  };

  const onSubmit = (values: FormValues) => {
    const gstError = validateGst(values);
    if (gstError) { toast.error(gstError); return; }
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
    const gstError = validateGst(values);
    if (gstError) { toast.error(gstError); return; }
    startTransition(async () => {
      try {
        if (isEditMode) {
          await updateInvoiceAction(existingInvoice!.id, values);
          toast.success("Invoice updated.");
          window.location.href = `/invoices/${existingInvoice!.id}${action ? `?auto=${action}` : ""}`;
        } else {
          const invoiceId = await createInvoiceAction(values);
          toast.success(values.mode === "draft" ? "Draft saved." : "Invoice created.");
          if (invoiceId) {
            window.location.href = `/invoices/${invoiceId}${action ? `?auto=${action}` : ""}`;
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
        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Document type">
                <Select
                  options={DOCUMENT_TYPES.map((item) => ({ label: item.label, value: item.value }))}
                  value={form.watch("document_type")}
                  onChange={(e) =>
                    form.setValue("document_type", e.target.value as FormValues["document_type"], { shouldDirty: true })
                  }
                />
              </FormField>
              <FormField label="Customer">
                <Select
                  options={customers.map((c) => ({
                    label: `${c.customer_name} • ${c.state_code}`,
                    value: c.id,
                  }))}
                  value={form.watch("customer_id")}
                  onChange={(e) => form.setValue("customer_id", e.target.value, { shouldDirty: true })}
                />
              </FormField>
              <FormField label="Issue date">
                <Input type="date" {...form.register("issue_date")} />
              </FormField>
              <FormField label="Due date">
                <Input type="date" {...form.register("due_date")} />
              </FormField>
              {/* TASK 4: Terms of Payment select */}
              <FormField label="Terms of Payment">
                <Select
                  options={PAYMENT_TERMS_OPTIONS}
                  value={form.watch("payment_terms") ?? "CREDIT"}
                  onChange={(e) => form.setValue("payment_terms", e.target.value, { shouldDirty: true })}
                />
              </FormField>
              {!isEditMode && (
                <FormField label="Received upfront">
                  <Input type="number" step="0.01" {...form.register("amount_paid", { valueAsNumber: true })} />
                </FormField>
              )}
            </div>

            {/* Invoice items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Invoice items</h3>
                  <p className="text-sm text-muted-foreground">
                    Live GST split updates instantly as you edit quantity, rate, or place of supply.
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={() => append(defaultItem())}>
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
                      className={`rounded-[26px] border bg-white/[0.03] p-4 transition-colors ${
                        invalidHsnIndexes.has(index) ? "border-red-500" : "border-white/10"
                      }`}
                    >
                      <div className="mb-3 flex items-end gap-3">
                        <FormField label="Preset item" className="w-36 flex-none">
                          <Select
                            placeholder="From catalog"
                            options={products.map((p) => ({
                              label: `${p.item_name} • ${formatCurrency(p.rate)}`,
                              value: p.id,
                            }))}
                            onChange={(e) => {
                              const sel = products.find((p) => p.id === e.target.value);
                              if (!sel) return;
                              form.setValue(`items.${index}.product_id`, sel.id);
                              form.setValue(`items.${index}.item_name`, sel.item_name);
                              form.setValue(`items.${index}.description`, sel.description ?? "");
                              form.setValue(`items.${index}.hsn_sac_code`, sel.hsn_code ?? sel.hsn_sac_code ?? "");
                              form.setValue(`items.${index}.rate`, sel.rate);
                              form.setValue(`items.${index}.unit`, sel.unit);
                              form.setValue(`items.${index}.gst_rate`, Number(sel.default_gst_rate));
                              setInvalidHsnIndexes((prev) => { const n = new Set(prev); n.delete(index); return n; });
                            }}
                          />
                        </FormField>
                        <FormField label="Item name" className="flex-1 min-w-0">
                          <Input className="h-9" placeholder="Goods / service description" {...form.register(`items.${index}.item_name`)} />
                        </FormField>
                        <FormField label="HSN / SAC" className="w-28 flex-none">
                          <Input
                            className="h-9"
                            placeholder="e.g. 9983"
                            {...form.register(`items.${index}.hsn_sac_code`, {
                              onChange: () => setInvalidHsnIndexes((prev) => { const n = new Set(prev); n.delete(index); return n; }),
                            })}
                          />
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

                      {invalidHsnIndexes.has(index) && (
                        <p className="mb-2 text-xs text-red-400">HSN/SAC code is required for GST invoices.</p>
                      )}

                      <div className="mb-3 grid grid-cols-4 gap-3">
                        <FormField label="Unit">
                          <Input className="h-9" placeholder="NOS" {...form.register(`items.${index}.unit`)} />
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
                            onChange={(e) => form.setValue(`items.${index}.gst_rate`, Number(e.target.value))}
                          >
                            {GST_OPTIONS.map((v) => (
                              <option key={v} value={v}>{v}%</option>
                            ))}
                          </select>
                        </FormField>
                      </div>

                      <div className="mb-3 grid grid-cols-2 gap-3">
                        <FormField label="Discount %">
                          <Input className="h-9" type="number" step="0.01" min={0} max={100} placeholder="0" {...form.register(`items.${index}.discount_percent`, { valueAsNumber: true })} />
                        </FormField>
                        <FormField label="Flat discount ₹">
                          <Input className="h-9" type="number" step="0.01" min={0} placeholder="0" {...form.register(`items.${index}.discount_amount`, { valueAsNumber: true })} />
                        </FormField>
                      </div>

                      <FormField label="Description">
                        <Textarea {...form.register(`items.${index}.description`)} className="min-h-[80px]" />
                      </FormField>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </Card>

          {/* Additional Details (collapsible) — TASK 9: all fields present */}
          <Card>
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => setAdditionalOpen((v) => !v)}
            >
              <div>
                <h3 className="text-lg font-semibold">Additional Details</h3>
                <p className="text-sm text-muted-foreground">e-Way bill, buyer order, dispatch info</p>
              </div>
              {additionalOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {additionalOpen && (
                <motion.div
                  key="additional"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField label="e-Way Bill No">
                        <Input placeholder="Enter e-Way Bill number" {...form.register("eway_bill_no")} />
                      </FormField>
                      <FormField label="Supplier's Ref">
                        <Input placeholder="Your reference" {...form.register("suppliers_ref")} />
                      </FormField>
                      <FormField label="Other Reference">
                        <Input {...form.register("other_ref")} />
                      </FormField>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <FormField label="Buyer Order No">
                        <Input {...form.register("buyer_order_no")} />
                      </FormField>
                      <FormField label="Buyer Order Date">
                        <Input type="date" {...form.register("buyer_order_date")} />
                      </FormField>
                      <FormField label="Dispatch Doc No">
                        <Input {...form.register("dispatch_doc_no")} />
                      </FormField>
                      <FormField label="Dispatch Date">
                        <Input type="date" {...form.register("dispatch_date")} />
                      </FormField>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Dispatch Through">
                        <Input placeholder="Transport/courier name" {...form.register("dispatch_through")} />
                      </FormField>
                      <FormField label="Destination">
                        <Input placeholder="Delivery destination" {...form.register("destination")} />
                      </FormField>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Consignee Details */}
          <Card className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Consignee Details</h3>
              <p className="text-sm text-muted-foreground">Leave blank if same as customer</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Consignee Name">
                <Input {...form.register("consignee_name")} />
              </FormField>
              <FormField label="Consignee GSTIN">
                <Input {...form.register("consignee_gstin")} />
              </FormField>
              <FormField label="Consignee Address" className="col-span-2">
                <Textarea {...form.register("consignee_address")} className="min-h-[80px]" />
              </FormField>
              <FormField label="Consignee State Code">
                <Input type="number" {...form.register("consignee_state_code", { valueAsNumber: true })} />
              </FormField>
            </div>
          </Card>

          {/* Declaration */}
          <Card className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Declaration</h3>
              <p className="text-sm text-muted-foreground">
                Leave blank to auto-generate from customer GSTIN/PAN on the invoice.
              </p>
            </div>
            <FormField label="Custom declaration text (optional)">
              <Textarea
                {...form.register("declaration_text")}
                className="min-h-[100px] text-xs"
                placeholder="Leave empty to use the standard GST declaration with customer GSTIN/PAN auto-inserted."
              />
            </FormField>
            {/* TASK 8: fixed toggle layout — toggle left, label right, no overlap */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => form.setValue("show_receiver_signature", !showReceiverSig)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  showReceiverSig ? "bg-emerald-400" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    showReceiverSig ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm text-muted-foreground">Show Receiver Signature field on invoice</span>
            </div>
          </Card>
        </div>

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
