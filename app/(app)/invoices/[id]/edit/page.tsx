import { redirect } from "next/navigation";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";
import { PageHeader } from "@/components/layout/page-header";
import { getBusinessProfile, getCustomers, getInvoiceById, getProducts, getSessionUser } from "@/lib/data/queries";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [businessProfile, invoiceRecord, customers, products] = await Promise.all([
    getBusinessProfile(user.id),
    getInvoiceById(user.id, id),
    getCustomers(user.id),
    getProducts(user.id),
  ]);

  if (!businessProfile) redirect("/setup");
  if (!invoiceRecord) redirect("/invoices");

  return (
    <div>
      <PageHeader
        eyebrow="Edit invoice"
        title={invoiceRecord.invoice_number}
        description="Update items, rates, dates, and details. The invoice number and financial year are preserved."
      />
      <InvoiceBuilder
        businessProfile={businessProfile}
        customers={customers}
        products={products}
        existingInvoice={invoiceRecord}
      />
    </div>
  );
}
