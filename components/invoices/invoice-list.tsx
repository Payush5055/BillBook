"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Copy, ExternalLink, FilePlus2, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cancelInvoiceAction, duplicateInvoiceAction, hardDeleteInvoiceAction } from "@/lib/actions";
import type { InvoiceListItem } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function InvoiceList({ invoices }: { invoices: InvoiceListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; number: string } | null>(null);

  const duplicateDocument = (invoiceId: string, targetType: string) => {
    startTransition(async () => {
      try {
        const newId = await duplicateInvoiceAction(invoiceId, targetType);
        toast.success("Document duplicated.");
        if (typeof window !== "undefined" && newId) window.location.href = `/invoices/${newId}`;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to duplicate document.");
      }
    });
  };

  const cancelDocument = (invoiceId: string) => {
    startTransition(async () => {
      try {
        await cancelInvoiceAction(invoiceId);
        toast.success("Document cancelled.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to cancel document.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      try {
        await hardDeleteInvoiceAction(deleteTarget.id);
        toast.success("Invoice deleted.");
        setDeleteTarget(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete invoice.");
      }
    });
  };

  return (
    <>
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {invoice.document_type.replaceAll("_", " ")}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{invoice.customer_name}</TableCell>
                <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                <TableCell>
                  <Badge className="capitalize">{invoice.status.replaceAll("_", " ")}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(invoice.grand_total)}</TableCell>
                <TableCell>{formatCurrency(invoice.amount_due)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/invoices/${invoice.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        duplicateDocument(
                          invoice.id,
                          ["quotation", "proforma_invoice"].includes(invoice.document_type) ? "gst_invoice" : invoice.document_type,
                        )
                      }
                    >
                      {["quotation", "proforma_invoice"].includes(invoice.document_type) ? (
                        <FilePlus2 className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {["quotation", "proforma_invoice"].includes(invoice.document_type) ? "Convert" : "Duplicate"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending || invoice.status === "cancelled"}
                      onClick={() => cancelDocument(invoice.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
                      disabled={deletePending}
                      onClick={() => setDeleteTarget({ id: invoice.id, number: invoice.invoice_number })}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete invoice"
        description={`Are you sure you want to delete invoice ${deleteTarget?.number ?? ""}? This action cannot be undone.`}
      >
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={confirmDelete}
            disabled={deletePending}
          >
            {deletePending ? "Deleting..." : "Yes, delete invoice"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deletePending}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </>
  );
}
