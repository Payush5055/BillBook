"use client";

import Image from "next/image";
import { forwardRef, useEffect, useState } from "react";
import type { BusinessProfile, Customer, Invoice, InvoiceItem } from "@/lib/types";
import { amountToWords, formatCurrency, formatDate } from "@/lib/utils";

const DEFAULT_DECLARATION =
  "I/WE HEREBY CERTIFY THAT MY/OUR REGISTRATION GST NO. IS IN FORCE ON THE DATE ON WHICH THE SALE OF GOODS/SERVICES COVERED BY THIS GST INVOICE HAS BEEN EFFECTED BY ME/US AND IT SHALL BE ACCOUNTED FOR THE TURNOVER OF SALES WHILE FILING OF THE RETURN AND THE DUE TAX IF ANY PAYABLE ON THE SALES HAS BEEN PAID OR SHALL BE PAID.";

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
    const hasConsignee = !!invoice.consignee_name;
    const declarationText = invoice.declaration_text || (isGst ? DEFAULT_DECLARATION : null);
    const showReceiverSig = invoice.show_receiver_signature !== false;

    // Business details: use invoice snapshot (set at creation) if available,
    // otherwise fall back to the current business_profile (legacy invoices).
    const bizName = invoice.business_name || businessProfile.business_name;
    const bizAddress = invoice.business_address || businessProfile.address;
    const bizCity = invoice.business_city ?? null;
    const bizState = invoice.business_state || businessProfile.state;
    const bizPincode = invoice.business_pincode ?? null;
    const bizGstin = invoice.business_gstin || businessProfile.gstin;
    const bizStateCode = invoice.business_state_code
      ? String(invoice.business_state_code)
      : businessProfile.state_code;
    const bizPhone = invoice.business_phone || businessProfile.phone;
    const bizEmail = invoice.business_email || businessProfile.email;
    const bizBankName = invoice.business_bank_name || businessProfile.bank_name;
    const bizBankAccount = invoice.business_bank_account || businessProfile.bank_account_number;
    const bizBankIfsc = invoice.business_bank_ifsc || businessProfile.bank_ifsc;

    // Build a full address line for display
    const addressParts = [bizAddress, bizCity, bizState, bizPincode].filter(Boolean);
    const bizFullAddress = addressParts.join(", ");

    // Reference fields — only show non-empty ones, eway bill listed first
    const refFields: { label: string; value: string | null | undefined }[] = [
      { label: "e-Way Bill No", value: invoice.eway_bill_no },
      { label: "Supplier's Ref", value: invoice.suppliers_ref },
      { label: "Other Ref", value: invoice.other_ref },
      { label: "Buyer Order No", value: invoice.buyer_order_no },
      { label: "Buyer Order Date", value: invoice.buyer_order_date ? formatDate(invoice.buyer_order_date) : null },
      { label: "Dispatch Doc No", value: invoice.dispatch_doc_no },
      { label: "Dispatch Date", value: invoice.dispatch_date ? formatDate(invoice.dispatch_date) : null },
      { label: "Dispatch Through", value: invoice.dispatch_through },
      { label: "Destination", value: invoice.destination },
    ].filter((f) => !!f.value);

    const statusColor =
      invoice.status === "paid"
        ? "#16a34a"
        : invoice.status === "partially_paid"
        ? "#d97706"
        : invoice.status === "cancelled"
        ? "#dc2626"
        : "#6b7280";

    return (
      <div
        ref={ref}
        className="mx-auto w-full max-w-[210mm] bg-white p-8 text-slate-900 shadow-2xl print:shadow-none"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-5">
          <div className="space-y-1">
            {businessProfile.logo_url && (
              <Image
                src={businessProfile.logo_url}
                alt={bizName}
                width={76}
                height={76}
                className="mb-2 h-16 w-16 rounded-2xl object-cover"
              />
            )}
            <h1 className="text-2xl font-bold leading-tight">{bizName}</h1>
            <p className="max-w-xs text-sm leading-5 text-slate-600">{bizFullAddress}</p>
            {bizPhone && <p className="text-sm text-slate-600">Ph: {bizPhone}</p>}
            {bizEmail && <p className="text-sm text-slate-600">Email: {bizEmail}</p>}
            {bizGstin && (
              <p className="text-sm font-medium">
                GSTIN: {bizGstin} | State Code: {bizStateCode}
              </p>
            )}
          </div>
          <div className="space-y-2 text-right">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
              {invoice.document_type.replaceAll("_", " ")}
            </p>
            <h2 className="text-3xl font-bold">{invoice.invoice_number}</h2>
            <div className="space-y-1 text-sm text-slate-600">
              <p>Issue: <span className="font-medium">{formatDate(invoice.issue_date)}</span></p>
              <p>Due: <span className="font-medium">{invoice.due_date ? formatDate(invoice.due_date) : "On receipt"}</span></p>
            </div>
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: statusColor }}
            >
              {invoice.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        {/* ===== REFERENCE FIELDS (includes e-Way Bill) ===== */}
        {refFields.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-3">
              {refFields.map((f) => (
                <div key={f.label} className="flex gap-1 text-xs">
                  <span className="font-semibold text-slate-500 whitespace-nowrap">{f.label}:</span>
                  <span className="text-slate-700">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PARTY DETAILS ROW ===== */}
        <div className="mt-5 grid gap-6 border-b border-slate-200 pb-5 md:grid-cols-2">
          {/* Bill To */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Bill To</p>
            <p className="mt-2 text-lg font-bold">{customer.customer_name}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-5 text-slate-600">{customer.address}</p>
            {customer.gstin && (
              <p className="mt-1 text-sm text-slate-600">GSTIN: {customer.gstin}</p>
            )}
            <p className="text-sm text-slate-600">
              State: {customer.state} | Code: {customer.state_code}
            </p>
            {customer.place_of_supply && (
              <p className="text-sm text-slate-600">Place of Supply: {customer.place_of_supply}</p>
            )}
            {customer.phone && (
              <p className="text-sm text-slate-600">Ph: {customer.phone}</p>
            )}
          </div>

          {/* Consignee or Payment Details */}
          {hasConsignee ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Consignee</p>
              <p className="mt-2 text-lg font-bold">{invoice.consignee_name}</p>
              {invoice.consignee_address && (
                <p className="mt-1 whitespace-pre-line text-sm leading-5 text-slate-600">{invoice.consignee_address}</p>
              )}
              {invoice.consignee_gstin && (
                <p className="mt-1 text-sm text-slate-600">GSTIN: {invoice.consignee_gstin}</p>
              )}
              {invoice.consignee_state_code && (
                <p className="text-sm text-slate-600">State Code: {invoice.consignee_state_code}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Payment Details</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p>Bank: <span className="font-medium">{bizBankName || "—"}</span></p>
                <p>Account: <span className="font-medium">{bizBankAccount || "—"}</span></p>
                <p>IFSC: <span className="font-medium">{bizBankIfsc || "—"}</span></p>
                {businessProfile.upi_id && (
                  <p>UPI: <span className="font-medium">{businessProfile.upi_id}</span></p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== LINE ITEMS TABLE ===== */}
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y-2 border-slate-300 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="py-3 pr-3">Sr</th>
              <th className="py-3 pr-3">Description</th>
              {isGst && <th className="py-3 pr-3 w-20">HSN/SAC</th>}
              <th className="py-3 pr-3 text-right">Qty</th>
              <th className="py-3 pr-3">Unit</th>
              <th className="py-3 pr-3 text-right">Rate</th>
              {isGst && <th className="py-3 pr-3 text-right">GST%</th>}
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.id}
                className="border-b border-slate-100 align-top"
                style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "#f8fafc" }}
              >
                <td className="py-3 pr-3 text-slate-500 text-xs">{idx + 1}</td>
                <td className="py-3 pr-3">
                  <p className="font-medium text-slate-900">{item.item_name}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                  ) : null}
                </td>
                {isGst && (
                  <td className="py-3 pr-3 text-xs font-mono text-slate-500">
                    {item.hsn_sac_code || "—"}
                  </td>
                )}
                <td className="py-3 pr-3 text-right text-slate-600">{item.quantity}</td>
                <td className="py-3 pr-3 text-slate-600">{item.unit}</td>
                <td className="py-3 pr-3 text-right text-slate-600">{formatCurrency(item.rate)}</td>
                {isGst && (
                  <td className="py-3 pr-3 text-right text-slate-600">{item.gst_rate}%</td>
                )}
                <td className="py-3 text-right font-semibold text-slate-900">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== TOTALS + SIGNATURES ===== */}
        <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Amount in Words</p>
              <p className="mt-2 text-sm italic leading-5 text-slate-700">
                {invoice.amount_in_words || amountToWords(invoice.grand_total)}
              </p>
            </div>

            {/* Bank details (only when consignee shown above takes the right column) */}
            {hasConsignee && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Payment Details</p>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>Bank: <span className="font-medium">{bizBankName || "—"}</span></p>
                  <p>Account: <span className="font-medium">{bizBankAccount || "—"}</span></p>
                  <p>IFSC: <span className="font-medium">{bizBankIfsc || "—"}</span></p>
                  {businessProfile.upi_id && (
                    <p>UPI: <span className="font-medium">{businessProfile.upi_id}</span></p>
                  )}
                </div>
              </div>
            )}

            {declarationText && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Declaration</p>
                <p className="mt-2 text-xs italic leading-5 text-slate-600">{declarationText}</p>
              </div>
            )}

            {businessProfile.terms_and_conditions && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Terms &amp; Conditions</p>
                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">
                  {businessProfile.terms_and_conditions}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="space-y-2 text-sm">
              <TRow label="Subtotal" value={invoice.subtotal} />
              {invoice.invoice_discount_total > 0 && (
                <TRow label="Invoice discount" value={invoice.invoice_discount_total} negative />
              )}
              <TRow label="Taxable amount" value={invoice.taxable_amount} />
              {!invoice.is_inter_state ? (
                <>
                  {invoice.cgst_total > 0 && <TRow label="CGST" value={invoice.cgst_total} />}
                  {invoice.sgst_total > 0 && <TRow label="SGST" value={invoice.sgst_total} />}
                </>
              ) : (
                invoice.igst_total > 0 && <TRow label="IGST" value={invoice.igst_total} />
              )}
              <TRow label="Total tax" value={invoice.total_tax_amount} />
              <div className="my-1 border-t border-slate-200" />
              <TRow label="Grand total" value={invoice.grand_total} strong />
              <TRow label="Paid" value={invoice.amount_paid} />
              <TRow
                label="Balance due"
                value={invoice.amount_due}
                strong
                redIfPositive={invoice.amount_due > 0}
              />
            </div>

            {isGst && invoice.irn ? (
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 border-t border-slate-200 pt-4">
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
                    <img src={irnQrUrl} alt="e-Invoice QR" width={100} height={100} />
                    <p style={{ fontSize: "8px" }} className="text-slate-500">Scan to verify</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex items-end justify-between">
              {showReceiverSig && (
                <div className="text-center">
                  <div className="h-10 w-28 border-b border-dashed border-slate-300" />
                  <p className="mt-1 text-xs text-slate-500">Receiver&apos;s Signature</p>
                </div>
              )}
              <div className={`text-right ${!showReceiverSig ? "ml-auto" : ""}`}>
                {businessProfile.signature_url ? (
                  <Image
                    src={businessProfile.signature_url}
                    alt="Signature"
                    width={120}
                    height={48}
                    className="ml-auto h-10 w-24 object-contain"
                  />
                ) : (
                  <div className="h-10 w-28 border-b border-dashed border-slate-300" />
                )}
                <p className="mt-1 text-xs text-slate-500">{bizName}</p>
                <p className="text-xs font-medium text-slate-700">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceDocument.displayName = "InvoiceDocument";

function TRow({
  label,
  value,
  negative,
  strong,
  redIfPositive,
}: {
  label: string;
  value: number;
  negative?: boolean;
  strong?: boolean;
  redIfPositive?: boolean;
}) {
  const colorClass = redIfPositive
    ? "text-red-600 font-bold"
    : strong
    ? "text-slate-900"
    : "";
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-bold" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className={colorClass}>
        {negative ? "−" : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}
