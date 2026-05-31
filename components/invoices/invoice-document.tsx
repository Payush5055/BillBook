"use client";

import Image from "next/image";
import { forwardRef, useEffect, useState } from "react";
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
    const [irnQrUrl, setIrnQrUrl] = useState("");
    useEffect(() => {
      if (!invoice.irn) return;
      import("qrcode").then((QR) => {
        QR.default.toDataURL(invoice.irn!, { width: 120, margin: 1 }).then(setIrnQrUrl).catch(() => {});
      });
    }, [invoice.irn]);

    const isGst = invoice.document_type === "gst_invoice";

    return (
      <div ref={ref} className="mx-auto w-full max-w-[210mm] bg-white p-8 text-slate-900 shadow-2xl print:shadow-none">
        {/* Header */}
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

        {/* Bill To + Payment Details */}
        <div className="grid gap-8 border-b border-slate-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Bill to</p>
            <p className="mt-3 text-lg font-semibold">{customer.customer_name}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{customer.address}</p>
            <p className="mt-2 text-sm text-slate-600">
              GSTIN: {customer.gstin || "N/A"} | State Code: {customer.state_code}
            </p>
            {customer.place_of_supply && (
              <p className="mt-1 text-sm text-slate-600">
                Place of Supply: {customer.place_of_supply}
              </p>
            )}
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

        {/* Line Items Table */}
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-slate-500">
              <th className="py-3 pr-4">Item</th>
              {isGst && <th className="py-3 pr-4 w-20">HSN/SAC</th>}
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
                {isGst && (
                  <td className="py-4 pr-4 text-slate-600 text-xs font-mono">
                    {item.hsn_sac_code || "-"}
                  </td>
                )}
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

        {/* Totals + Signature */}
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

            {/* IRN + QR section — only when IRN is set */}
            {isGst && invoice.irn ? (
              <div className="mt-6 grid grid-cols-[1fr_auto] gap-4 border-t border-slate-200 pt-4">
                <div className="space-y-1">
                  <p style={{ fontSize: "7px", fontFamily: "monospace", wordBreak: "break-all" }} className="text-slate-700">
                    <span className="font-semibold">IRN:</span> {invoice.irn}
                  </p>
                  {invoice.ack_number && (
                    <p style={{ fontSize: "7px" }} className="text-slate-700">
                      <span className="font-semibold">Ack No:</span> {invoice.ack_number}
                    </p>
                  )}
                  {invoice.ack_date && (
                    <p style={{ fontSize: "7px" }} className="text-slate-700">
                      <span className="font-semibold">Ack Date:</span> {invoice.ack_date}
                    </p>
                  )}
                </div>
                {irnQrUrl && (
                  <div className="flex flex-col items-center gap-1">
                    <img src={irnQrUrl} alt="e-Invoice QR" width={120} height={120} />
                    <p className="text-[9px] text-slate-500">Scan to verify</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex items-end justify-end">
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
