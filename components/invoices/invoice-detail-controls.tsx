"use client";

import { useState, useTransition } from "react";
import { CreditCard, Mail, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaymentForm } from "@/components/forms/payment-form";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  cancelInvoiceAction,
  duplicateInvoiceAction,
  markInvoiceUnpaidAction,
  sendInvoiceEmailAction,
} from "@/lib/actions";

export function InvoiceDetailControls({
  invoiceId,
  amountDue,
  invoiceNumber,
  documentType,
  autoAction,
  customerEmail,
}: {
  invoiceId: string;
  amountDue: number;
  invoiceNumber: string;
  documentType: string;
  autoAction?: "download" | "print" | null;
  customerEmail?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emailPending, startEmailTransition] = useTransition();
  const [pending, startTransition] = useTransition();

  const convertToInvoice = () => {
    startTransition(async () => {
      try {
        const newId = await duplicateInvoiceAction(invoiceId, "gst_invoice");
        toast.success("Quotation converted to invoice.");
        if (typeof window !== "undefined" && newId) window.location.href = `/invoices/${newId}`;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to convert document.");
      }
    });
  };

  const cancelDocument = () => {
    startTransition(async () => {
      try {
        await cancelInvoiceAction(invoiceId);
        toast.success("Document cancelled.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to cancel document.");
      }
    });
  };

  const markUnpaid = () => {
    startTransition(async () => {
      try {
        await markInvoiceUnpaidAction(invoiceId);
        toast.success("Invoice marked unpaid.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update invoice.");
      }
    });
  };

  const sendEmail = () => {
    startEmailTransition(async () => {
      try {
        await sendInvoiceEmailAction(invoiceId);
        toast.success(`Email sent to ${customerEmail}.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to send email.");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} disabled={amountDue <= 0}>
        <CreditCard className="mr-2 h-4 w-4" />
        Record payment
      </Button>
      {customerEmail ? (
        <Button type="button" variant="secondary" onClick={sendEmail} disabled={emailPending}>
          <Mail className="mr-2 h-4 w-4" />
          {emailPending ? "Sending..." : "Send email"}
        </Button>
      ) : null}
      {["quotation", "proforma_invoice"].includes(documentType) ? (
        <Button type="button" variant="secondary" onClick={convertToInvoice} disabled={pending}>
          Convert to invoice
        </Button>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        onClick={() => router.push(`/invoices/${invoiceId}/edit`)}
        disabled={pending}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
      <Button type="button" variant="secondary" onClick={markUnpaid} disabled={pending}>
        Mark unpaid
      </Button>
      <Button type="button" variant="ghost" onClick={cancelDocument} disabled={pending}>
        Cancel invoice
      </Button>
      <InvoiceActions targetId="invoice-document" invoiceNumber={invoiceNumber} autoAction={autoAction} invoiceId={invoiceId} />

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Record payment"
        description="Track partial and full payments against this invoice."
      >
        <PaymentForm invoiceId={invoiceId} maxAmount={amountDue} onSuccess={() => setOpen(false)} />
      </Dialog>
    </div>
  );
}
