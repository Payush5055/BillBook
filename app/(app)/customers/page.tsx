import { redirect } from "next/navigation";
import { CustomersManager } from "@/components/customers-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getCustomers, getInvoiceList, getSessionUser } from "@/lib/data/queries";

export default async function CustomersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [customers, invoiceHistory] = await Promise.all([
    getCustomers(user.id),
    getInvoiceList(user.id, { page: 1, pageSize: 200 }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Customers and parties"
        description="Maintain reusable party records with GST state info, searchability, billing history, and outstanding visibility."
      />
      <CustomersManager customers={customers} invoiceHistory={invoiceHistory.data} />
    </div>
  );
}
