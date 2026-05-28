"use client";

import { useState, useTransition } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PaymentForm } from "@/components/forms/payment-form";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  cancelInvoiceAction,
  duplicateInvoiceAction,
  markInvoiceUnpaidAction,
} from "@/lib/actions";

export function InvoiceDetailControls({
  invoiceId,
  amountDue,
  invoiceNumber,
  documentType,
}: {
  invoiceId: string;
  amountDue: number;
  invoiceNumber: string;
  documentType: string;
}) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} disabled={amountDue <= 0}>
        <CreditCard className="mr-2 h-4 w-4" />
        Record payment
      </Button>
      {documentType === "quotation" ? (
        <Button type="button" variant="secondary" onClick={convertToInvoice} disabled={pending}>
          Convert to invoice
        </Button>
      ) : null}
      <Button type="button" variant="secondary" onClick={markUnpaid} disabled={pending}>
        Mark unpaid
      </Button>
      <Button type="button" variant="ghost" onClick={cancelDocument} disabled={pending}>
        Cancel
      </Button>
      <InvoiceActions targetId="invoice-document" invoiceNumber={invoiceNumber} />

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
