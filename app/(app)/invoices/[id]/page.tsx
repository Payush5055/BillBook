import { redirect } from "next/navigation";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { InvoiceDetailControls } from "@/components/invoices/invoice-detail-controls";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBusinessProfile, getInvoiceById, getSessionUser } from "@/lib/data/queries";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ auto?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [businessProfile, invoiceRecord] = await Promise.all([
    getBusinessProfile(user.id),
    getInvoiceById(user.id, id),
  ]);

  if (!businessProfile || !invoiceRecord) redirect("/invoices");

  const customer = invoiceRecord.customers;
  const items = invoiceRecord.invoice_items ?? [];
  const payments = (invoiceRecord.payments ?? []).filter(
    (payment: { deleted_at?: string | null }) => !payment.deleted_at,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Document"
        title={invoiceRecord.invoice_number}
        description="Open, print, download, and manage collections against a production-ready invoice layout."
        action={
          <InvoiceDetailControls
            invoiceId={invoiceRecord.id}
            amountDue={invoiceRecord.amount_due}
            invoiceNumber={invoiceRecord.invoice_number}
            documentType={invoiceRecord.document_type}
            customerEmail={customer.email ?? null}
            autoAction={
              resolvedSearchParams?.auto === "download" || resolvedSearchParams?.auto === "print"
                ? resolvedSearchParams.auto
                : null
            }
          />
        }
      />

      <div id="invoice-document">
        <InvoiceDocument
          invoice={invoiceRecord}
          customer={customer}
          items={items}
          businessProfile={businessProfile}
        />
      </div>

      <Card className="no-print">
        <h3 className="text-lg font-semibold">Payment timeline</h3>
        <div className="mt-4 space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            payments.map(
              (payment: {
                id: string;
                payment_date: string;
                payment_mode: string;
                amount: number;
                transaction_reference?: string | null;
              }) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div>
                    <p className="font-medium capitalize">{payment.payment_mode.replaceAll("_", " ")}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.payment_date)}
                      {payment.transaction_reference ? ` • ${payment.transaction_reference}` : ""}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                </div>
              ),
            )
          )}
        </div>
      </Card>
    </div>
  );
}
