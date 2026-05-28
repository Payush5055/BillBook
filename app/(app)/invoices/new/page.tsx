import Link from "next/link";
import { redirect } from "next/navigation";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getBusinessProfile, getCustomers, getProducts, getSessionUser } from "@/lib/data/queries";

export default async function NewInvoicePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [businessProfile, customers, products] = await Promise.all([
    getBusinessProfile(user.id),
    getCustomers(user.id),
    getProducts(user.id),
  ]);

  if (!businessProfile) redirect("/setup");

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Invoice studio"
          title="Create your first customer before invoicing"
          description="Invoices need a reusable party record so GST state detection, billing history, and payment tracking stay consistent."
          action={
            <Button asChild>
              <Link href="/customers">Create customer</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Invoice studio"
        title="Create an invoice that feels instant"
        description="Real-time GST calculations, reusable catalog items, live totals, and clean draft or publish flows."
      />
      <InvoiceBuilder businessProfile={businessProfile} customers={customers} products={products} />
    </div>
  );
}
