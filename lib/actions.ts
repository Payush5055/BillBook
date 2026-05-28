"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { calculateInvoiceTotals, resolveInvoiceStatus } from "@/lib/gst";
import { createClient } from "@/lib/supabase/server";
import { uploadAsset } from "@/lib/supabase/storage";
import type { BusinessProfile, Customer } from "@/lib/types";
import {
  authSchema,
  businessProfileSchema,
  customerSchema,
  invoiceSchema,
  paymentSchema,
  productSchema,
} from "@/lib/validations";
import { amountToWords, financialYearFromDate } from "@/lib/utils";

function normalizeOptional(value?: string | null) {
  return value ? value : null;
}

async function getCurrentUserOrThrow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function signInAction(values: { email: string; password: string }) {
  const payload = authSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(payload);
  if (error) throw new Error(error.message);

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function upsertBusinessProfileAction(values: Record<string, unknown>) {
  const payload = businessProfileSchema.parse(values);
  const { supabase, user } = await getCurrentUserOrThrow();

  const data: Database["public"]["Tables"]["business_profiles"]["Insert"] = {
    user_id: user.id,
    business_name: payload.business_name,
    address: payload.address,
    gstin: normalizeOptional(payload.gstin),
    state: payload.state,
    state_code: payload.state_code,
    phone: normalizeOptional(payload.phone),
    email: normalizeOptional(payload.email),
    bank_account_name: normalizeOptional(payload.bank_account_name),
    bank_name: normalizeOptional(payload.bank_name),
    bank_account_number: normalizeOptional(payload.bank_account_number),
    bank_ifsc: normalizeOptional(payload.bank_ifsc),
    upi_id: normalizeOptional(payload.upi_id),
    terms_and_conditions: normalizeOptional(payload.terms_and_conditions),
    invoice_prefix: payload.invoice_prefix,
    financial_year_lock_before: normalizeOptional(payload.financial_year_lock_before),
    logo_url: normalizeOptional(payload.logo_url),
    signature_url: normalizeOptional(payload.signature_url),
  };

  const { data: existingProfile } = await supabase
    .from("business_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existingProfile
    ? await supabase.from("business_profiles").update(data as never).eq("user_id", user.id)
    : await supabase.from("business_profiles").insert(data as never);

  if (error) throw new Error(error.message);

  revalidatePath("/setup");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function uploadBrandAssetAction(formData: FormData) {
  return uploadAsset(formData, "brand-assets");
}

export async function upsertCustomerAction(values: Record<string, unknown>) {
  const payload = customerSchema.parse(values);
  const { supabase, user } = await getCurrentUserOrThrow();

  const data: Database["public"]["Tables"]["customers"]["Insert"] = {
    id: payload.id,
    user_id: user.id,
    customer_name: payload.customer_name,
    gstin: normalizeOptional(payload.gstin),
    address: payload.address,
    state: payload.state,
    state_code: payload.state_code,
    phone: normalizeOptional(payload.phone),
    email: normalizeOptional(payload.email),
    notes: normalizeOptional(payload.notes),
  };

  const query = payload.id
    ? supabase.from("customers").update(data as never).eq("id", payload.id).eq("user_id", user.id)
    : supabase.from("customers").insert(data as never);

  const { error } = await query;
  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  revalidatePath("/invoices/new");
}

export async function softDeleteCustomerAction(id: string) {
  const { supabase, user } = await getCurrentUserOrThrow();
  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/customers");
}

export async function upsertProductAction(values: Record<string, unknown>) {
  const payload = productSchema.parse(values);
  const { supabase, user } = await getCurrentUserOrThrow();

  const data: Database["public"]["Tables"]["products"]["Insert"] = {
    id: payload.id,
    user_id: user.id,
    item_name: payload.item_name,
    hsn_sac_code: normalizeOptional(payload.hsn_sac_code),
    default_gst_rate: payload.default_gst_rate,
    unit: payload.unit,
    rate: payload.rate,
    description: normalizeOptional(payload.description),
    item_type: payload.item_type,
  };

  const query = payload.id
    ? supabase.from("products").update(data as never).eq("id", payload.id).eq("user_id", user.id)
    : supabase.from("products").insert(data as never);

  const { error } = await query;
  if (error) throw new Error(error.message);

  revalidatePath("/catalog");
  revalidatePath("/invoices/new");
}

export async function softDeleteProductAction(id: string) {
  const { supabase, user } = await getCurrentUserOrThrow();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/catalog");
}

export async function createInvoiceAction(values: Record<string, unknown>) {
  const payload = invoiceSchema.parse(values);
  const { supabase, user } = await getCurrentUserOrThrow();

  const [{ data: businessProfileData }, { data: customerData }] = await Promise.all([
    supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("customers")
      .select("*")
      .eq("id", payload.customer_id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const businessProfile = businessProfileData as BusinessProfile | null;
  const customer = customerData as Customer | null;

  if (!businessProfile) throw new Error("Complete business setup before creating invoices.");
  if (!customer) throw new Error("Customer not found.");

  const issueDate = new Date(payload.issue_date);
  if (
    businessProfile.financial_year_lock_before &&
    issueDate < new Date(businessProfile.financial_year_lock_before)
  ) {
    throw new Error("This financial year is locked in settings.");
  }

  const totals = calculateInvoiceTotals({
    businessStateCode: businessProfile.state_code,
    customerStateCode: customer.state_code,
    documentType: payload.document_type,
    items: payload.items,
    flatDiscount: payload.flat_discount,
    amountPaid: payload.amount_paid,
  });

  const fy = financialYearFromDate(payload.issue_date);
  const { data: existingSequenceData } = await supabase
    .from("invoices")
    .select("sequence_number")
    .eq("user_id", user.id)
    .eq("financial_year_label", fy.label)
    .eq("document_type", payload.document_type)
    .order("sequence_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingSequence = existingSequenceData as { sequence_number: number } | null;
  const sequenceNumber = (existingSequence?.sequence_number ?? 0) + 1;
  const invoiceNumber = `${businessProfile.invoice_prefix}/${fy.label}/${String(sequenceNumber).padStart(3, "0")}`;
  const status =
    payload.mode === "draft"
      ? "draft"
      : resolveInvoiceStatus(totals.grandTotal, payload.amount_paid);

  const rpcPayload = {
    user_id: user.id,
    customer_id: payload.customer_id,
    source_invoice_id: payload.source_invoice_id,
    document_type: payload.document_type,
    invoice_number: invoiceNumber,
    sequence_number: sequenceNumber,
    financial_year_label: fy.label,
    issue_date: payload.issue_date,
    due_date: normalizeOptional(payload.due_date),
    status,
    payment_terms: normalizeOptional(payload.payment_terms),
    notes: normalizeOptional(payload.notes),
    remarks: normalizeOptional(payload.remarks),
    place_of_supply_state_code: customer.state_code,
    is_inter_state: totals.isInterState,
    subtotal: totals.subtotal,
    item_discount_total: totals.itemDiscountTotal,
    invoice_discount_total: totals.invoiceDiscountTotal,
    taxable_amount: totals.taxableAmount,
    cgst_total: totals.cgstTotal,
    sgst_total: totals.sgstTotal,
    igst_total: totals.igstTotal,
    total_tax_amount: totals.totalTaxAmount,
    grand_total: totals.grandTotal,
    amount_paid: payload.amount_paid,
    amount_due: totals.amountDue,
    amount_in_words: totals.amountInWords,
    items: totals.items,
  };

  const { data, error } = await (supabase.rpc as any)("create_invoice_with_items", {
    payload: rpcPayload,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/reports");
  revalidatePath("/payments");

  return data;
}

export async function recordPaymentAction(values: Record<string, unknown>) {
  const payload = paymentSchema.parse(values);
  const { supabase, user } = await getCurrentUserOrThrow();

  const { data, error } = await (supabase.rpc as any)("record_invoice_payment", {
    payload: {
      ...payload,
      user_id: user.id,
      transaction_reference: normalizeOptional(payload.transaction_reference),
      notes: normalizeOptional(payload.notes),
    },
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${payload.invoice_id}`);
  revalidatePath("/payments");
  revalidatePath("/reports");
  return data;
}

export async function duplicateInvoiceAction(sourceInvoiceId: string, targetDocumentType: string) {
  const { supabase } = await getCurrentUserOrThrow();
  const { data, error } = await (supabase.rpc as any)("duplicate_invoice_document", {
    source_invoice_id: sourceInvoiceId,
    target_document_type: targetDocumentType,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return data;
}

export async function cancelInvoiceAction(invoiceId: string) {
  const { supabase, user } = await getCurrentUserOrThrow();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "cancelled" } as never)
    .eq("id", invoiceId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
}

export async function markInvoiceUnpaidAction(invoiceId: string) {
  const { supabase, user } = await getCurrentUserOrThrow();
  const { data: invoiceData } = await supabase
    .from("invoices")
    .select("grand_total")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .maybeSingle();
  const invoice = invoiceData as { grand_total: number } | null;
  if (!invoice) throw new Error("Invoice not found.");

  const { error: paymentError } = await supabase
    .from("payments")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("invoice_id", invoiceId)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (paymentError) throw new Error(paymentError.message);

  const { error } = await supabase
    .from("invoices")
    .update({
      amount_paid: 0,
      amount_due: invoice.grand_total,
      status: "unpaid",
      amount_in_words: amountToWords(invoice.grand_total),
    } as never)
    .eq("id", invoiceId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/payments");
}

export async function softDeleteInvoiceAction(invoiceId: string) {
  const { supabase, user } = await getCurrentUserOrThrow();
  const { error } = await supabase
    .from("invoices")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", invoiceId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}
