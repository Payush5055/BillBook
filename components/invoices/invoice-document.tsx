"use client";

import Image from "next/image";
import { forwardRef } from "react";
import type { BusinessProfile, Customer, Invoice, InvoiceItem } from "@/lib/types";
import { amountToWords, formatCurrency, formatDate } from "@/lib/utils";

type InvoiceDocumentProps = {
  invoice: Invoice;
  customer: Customer;
  items: InvoiceItem[];
  businessProfile: BusinessProfile;
};

export const InvoiceDocument = forwardRef<HTMLDivElement, InvoiceDocumentProps>(
  ({ invoice, customer, items, businessProfile }, ref) => {
    return (
      <div ref={ref} className="mx-auto w-full max-w-[210mm] bg-white p-8 text-slate-900 shadow-2xl print:shadow-none">
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-3">
            {businessProfile.logo_url ? (
              <Image src={businessProfile.logo_url} alt={businessProfile.business_name} width={76} height={76} className="h-16 w-16 rounded-2xl object-cover" />
            ) : null}
            <div>
              <h1 className="text-2xl font-semibold">{businessProfile.business_name}</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{businessProfile.address}</p>
              <p className="mt-2 text-sm text-slate-600">
                GSTIN: {businessProfile.gstin || "N/A"} | State Code: {businessProfile.state_code}
              </p>
              <p className="text-sm text-slate-600">
                {businessProfile.phone || "No phone"} • {businessProfile.email || "No email"}
              </p>
            </div>
          </div>
          <div className="space-y-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              {invoice.document_type.replaceAll("_", " ")}
            </p>
            <h2 className="text-3xl font-semibold">{invoice.invoice_number}</h2>
            <div className="text-sm text-slate-600">
              <p>Issue: {formatDate(invoice.issue_date)}</p>
              <p>Due: {invoice.due_date ? formatDate(invoice.due_date) : "On receipt"}</p>
              <p>Status: {invoice.status.replaceAll("_", " ")}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 border-b border-slate-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Bill to</p>
            <p className="mt-3 text-lg font-semibold">{customer.customer_name}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{customer.address}</p>
            <p className="mt-2 text-sm text-slate-600">
              GSTIN: {customer.gstin || "N/A"} | State Code: {customer.state_code}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Payment details</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Bank: {businessProfile.bank_name || "-"}</p>
              <p>Account: {businessProfile.bank_account_number || "-"}</p>
              <p>IFSC: {businessProfile.bank_ifsc || "-"}</p>
              <p>UPI: {businessProfile.upi_id || "-"}</p>
            </div>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-slate-500">
              <th className="py-3 pr-4">Item</th>
              <th className="py-3 pr-4">Qty</th>
              <th className="py-3 pr-4">Rate</th>
              <th className="py-3 pr-4">GST</th>
              <th className="py-3 pr-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 align-top">
                <td className="py-4 pr-4">
                  <p className="font-medium text-slate-900">{item.item_name}</p>
                  {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
                </td>
                <td className="py-4 pr-4 text-slate-600">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-4 pr-4 text-slate-600">{formatCurrency(item.rate)}</td>
                <td className="py-4 pr-4 text-slate-600">{item.gst_rate}%</td>
                <td className="py-4 text-right font-medium text-slate-900">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Amount in words</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{invoice.amount_in_words || amountToWords(invoice.grand_total)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Terms & conditions</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {businessProfile.terms_and_conditions || "Thank you for your business."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="space-y-3 text-sm">
              <Row label="Subtotal" value={invoice.subtotal} />
              <Row label="Invoice discount" value={invoice.invoice_discount_total} negative />
              <Row label="Taxable amount" value={invoice.taxable_amount} />
              <Row label="CGST" value={invoice.cgst_total} />
              <Row label="SGST" value={invoice.sgst_total} />
              <Row label="IGST" value={invoice.igst_total} />
              <Row label="Total tax" value={invoice.total_tax_amount} />
              <Row label="Grand total" value={invoice.grand_total} strong />
              <Row label="Paid" value={invoice.amount_paid} />
              <Row label="Balance due" value={invoice.amount_due} strong />
            </div>

            <div className="mt-8 flex items-end justify-between gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-slate-300 text-[10px] text-slate-500">
                QR Placeholder
              </div>
              <div className="text-right">
                {businessProfile.signature_url ? (
                  <Image src={businessProfile.signature_url} alt="Signature" width={120} height={48} className="ml-auto h-12 w-28 object-contain" />
                ) : null}
                <p className="mt-2 text-sm font-medium">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceDocument.displayName = "InvoiceDocument";

function Row({
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
    <div className={`flex items-center justify-between ${strong ? "text-base font-semibold" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className={strong ? "text-slate-900" : ""}>{negative ? "-" : ""}{formatCurrency(value)}</span>
    </div>
  );
}
