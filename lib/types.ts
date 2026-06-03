import type { Database } from "@/lib/database.types";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type BusinessProfile = Database["public"]["Tables"]["business_profiles"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type InvoiceListItem = Database["public"]["Views"]["invoice_list_view"]["Row"];
export type PaymentListItem = Payment & {
  invoices?: {
    invoice_number: string;
  } | null;
};
export type InvoiceDetailRecord = Invoice & {
  customers: Customer;
  invoice_items: InvoiceItem[];
  payments: Payment[];
};

export type DocumentType = Invoice["document_type"];
export type InvoiceStatus = Invoice["status"];
export type PaymentMode = Payment["payment_mode"];

export type InvoiceBuilderItem = {
  product_id?: string | null;
  item_name: string;
  description?: string | null;
  hsn_sac_code?: string | null;
  quantity: number;
  unit: string;
  rate: number;
  gst_rate: number;
  discount_percent: number;
  discount_amount: number;
};

export type InvoiceCalculationLine = InvoiceBuilderItem & {
  line_subtotal: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  line_total: number;
  sort_order: number;
};

export type InvoiceCalculationResult = {
  isInterState: boolean;
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTaxAmount: number;
  grandTotal: number;
  amountDue: number;
  amountInWords: string;
  items: InvoiceCalculationLine[];
};
