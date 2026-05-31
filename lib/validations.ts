import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const businessProfileSchema = z.object({
  business_name: z.string().min(2),
  address: z.string().min(8),
  gstin: z.string().trim().toUpperCase().optional().or(z.literal("")),
  state: z.string().min(2),
  state_code: z.string().length(2),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  bank_account_name: z.string().optional().or(z.literal("")),
  bank_name: z.string().optional().or(z.literal("")),
  bank_account_number: z.string().optional().or(z.literal("")),
  bank_ifsc: z.string().optional().or(z.literal("")),
  upi_id: z.string().optional().or(z.literal("")),
  terms_and_conditions: z.string().optional().or(z.literal("")),
  invoice_prefix: z.string().min(2).max(12),
  financial_year_lock_before: z.string().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  signature_url: z.string().url().optional().or(z.literal("")),
});

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().min(2),
  gstin: z.string().trim().toUpperCase().optional().or(z.literal("")),
  address: z.string().min(8),
  state: z.string().min(2),
  state_code: z.string().length(2),
  place_of_supply: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  item_name: z.string().min(2),
  hsn_sac_code: z.string().optional().or(z.literal("")),
  hsn_code: z.string().optional().or(z.literal("")),
  default_gst_rate: z.coerce.number().min(0).max(28),
  unit: z.string().min(1),
  rate: z.coerce.number().min(0),
  description: z.string().optional().or(z.literal("")),
  item_type: z.enum(["goods", "service"]),
});

export const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  payment_date: z.string().min(1),
  payment_mode: z.enum(["cash", "bank_transfer", "upi", "cheque"]),
  transaction_reference: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  notes: z.string().optional().or(z.literal("")),
});

export const invoiceItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  item_name: z.string().min(1),
  description: z.string().optional().nullable(),
  hsn_sac_code: z.string().optional().nullable(),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  rate: z.coerce.number().min(0),
  gst_rate: z.coerce.number().min(0).max(28),
  discount_percent: z.coerce.number().min(0).max(100),
  discount_amount: z.coerce.number().min(0),
});

export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid(),
  document_type: z.enum(["gst_invoice", "non_gst_invoice", "quotation", "proforma_invoice"]),
  issue_date: z.string().min(1),
  due_date: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  flat_discount: z.coerce.number().min(0).default(0),
  amount_paid: z.coerce.number().min(0).default(0),
  items: z.array(invoiceItemSchema).min(1),
  mode: z.enum(["draft", "publish"]).default("publish"),
  source_invoice_id: z.string().uuid().optional().nullable(),
});
