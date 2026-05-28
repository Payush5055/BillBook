import { amountToWords, roundCurrency } from "@/lib/utils";
import type { InvoiceBuilderItem, InvoiceCalculationResult } from "@/lib/types";

type CalculationInput = {
  businessStateCode: string;
  customerStateCode: string;
  documentType: "gst_invoice" | "non_gst_invoice" | "quotation" | "proforma_invoice";
  items: InvoiceBuilderItem[];
  flatDiscount?: number;
  amountPaid?: number;
};

export function calculateInvoiceTotals({
  businessStateCode,
  customerStateCode,
  documentType,
  items,
  flatDiscount = 0,
  amountPaid = 0,
}: CalculationInput): InvoiceCalculationResult {
  const isInterState = businessStateCode !== customerStateCode;
  const taxEnabled = documentType !== "non_gst_invoice";

  const calculatedItems = items.map((item, index) => {
    const quantity = Number(item.quantity || 0);
    const rate = Number(item.rate || 0);
    const discountPercent = Number(item.discount_percent || 0);
    const flatItemDiscount = Number(item.discount_amount || 0);
    const gstRate = taxEnabled ? Number(item.gst_rate || 0) : 0;

    const lineSubtotal = roundCurrency(quantity * rate);
    const percentDiscountAmount = roundCurrency((lineSubtotal * discountPercent) / 100);
    const totalDiscount = roundCurrency(percentDiscountAmount + flatItemDiscount);
    const taxableAmount = roundCurrency(Math.max(lineSubtotal - totalDiscount, 0));
    const totalTax = roundCurrency((taxableAmount * gstRate) / 100);

    const cgstAmount = taxEnabled && !isInterState ? roundCurrency(totalTax / 2) : 0;
    const sgstAmount = taxEnabled && !isInterState ? roundCurrency(totalTax / 2) : 0;
    const igstAmount = taxEnabled && isInterState ? totalTax : 0;

    return {
      ...item,
      gst_rate: gstRate,
      line_subtotal: lineSubtotal,
      taxable_amount: taxableAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      line_total: roundCurrency(taxableAmount + cgstAmount + sgstAmount + igstAmount),
      sort_order: index,
    };
  });

  const subtotal = roundCurrency(
    calculatedItems.reduce((sum, item) => sum + item.line_subtotal, 0),
  );
  const itemDiscountTotal = roundCurrency(
    calculatedItems.reduce((sum, item) => sum + (item.line_subtotal - item.taxable_amount), 0),
  );
  const taxableBeforeInvoiceDiscount = roundCurrency(
    calculatedItems.reduce((sum, item) => sum + item.taxable_amount, 0),
  );

  const invoiceDiscountTotal = roundCurrency(flatDiscount);
  const taxableAmount = roundCurrency(
    Math.max(taxableBeforeInvoiceDiscount - invoiceDiscountTotal, 0),
  );

  const scale = taxableBeforeInvoiceDiscount
    ? taxableAmount / taxableBeforeInvoiceDiscount
    : 0;

  const scaledItems = calculatedItems.map((item) => {
    if (!taxEnabled || taxableBeforeInvoiceDiscount === 0) return item;
    const scaledTaxable = roundCurrency(item.taxable_amount * scale);
    const totalTax = roundCurrency((scaledTaxable * item.gst_rate) / 100);
    return {
      ...item,
      taxable_amount: scaledTaxable,
      cgst_amount: !isInterState ? roundCurrency(totalTax / 2) : 0,
      sgst_amount: !isInterState ? roundCurrency(totalTax / 2) : 0,
      igst_amount: isInterState ? totalTax : 0,
      line_total: roundCurrency(scaledTaxable + totalTax),
    };
  });

  const cgstTotal = roundCurrency(scaledItems.reduce((sum, item) => sum + item.cgst_amount, 0));
  const sgstTotal = roundCurrency(scaledItems.reduce((sum, item) => sum + item.sgst_amount, 0));
  const igstTotal = roundCurrency(scaledItems.reduce((sum, item) => sum + item.igst_amount, 0));
  const totalTaxAmount = roundCurrency(cgstTotal + sgstTotal + igstTotal);
  const grandTotal = roundCurrency(taxableAmount + totalTaxAmount);
  const amountDue = roundCurrency(Math.max(grandTotal - amountPaid, 0));

  return {
    isInterState,
    subtotal,
    itemDiscountTotal,
    invoiceDiscountTotal,
    taxableAmount,
    cgstTotal,
    sgstTotal,
    igstTotal,
    totalTaxAmount,
    grandTotal,
    amountDue,
    amountInWords: amountToWords(grandTotal),
    items: scaledItems,
  };
}

export function resolveInvoiceStatus(grandTotal: number, amountPaid: number) {
  if (amountPaid <= 0) return "unpaid" as const;
  if (amountPaid >= grandTotal) return "paid" as const;
  return "partially_paid" as const;
}
