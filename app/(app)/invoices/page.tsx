import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getCustomers, getInvoiceList, getSessionUser } from "@/lib/data/queries";

function buildPageLink(
  searchParams: {
    q?: string;
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
    page?: string;
  } | undefined,
  page: number,
) {
  const params = new URLSearchParams();
  if (searchParams?.q) params.set("q", searchParams.q);
  if (searchParams?.status) params.set("status", searchParams.status);
  if (searchParams?.customerId) params.set("customerId", searchParams.customerId);
  if (searchParams?.from) params.set("from", searchParams.from);
  if (searchParams?.to) params.set("to", searchParams.to);
  params.set("page", String(page));
  return `/invoices?${params.toString()}`;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = Number(resolvedSearchParams?.page || "1");
  const [customers, invoices] = await Promise.all([
    getCustomers(user.id),
    getInvoiceList(user.id, {
      search: resolvedSearchParams?.q,
      status: resolvedSearchParams?.status,
      customerId: resolvedSearchParams?.customerId,
      from: resolvedSearchParams?.from,
      to: resolvedSearchParams?.to,
      page,
      pageSize: 12,
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(invoices.count / 12));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="Invoices, quotations, and proforma history"
        description="Search, filter, paginate, duplicate, convert quotations to invoices, and manage payment states from one timeline."
        action={
          <Button asChild>
            <Link href="/invoices/new" className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New invoice
            </Link>
          </Button>
        }
      />

      <Card>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            name="q"
            placeholder="Search invoice or customer..."
            defaultValue={resolvedSearchParams?.q}
          />
          <Select
            name="status"
            placeholder="All statuses"
            defaultValue={resolvedSearchParams?.status}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Paid", value: "paid" },
              { label: "Partially paid", value: "partially_paid" },
              { label: "Unpaid", value: "unpaid" },
              { label: "Cancelled", value: "cancelled" },
            ]}
          />
          <Select
            name="customerId"
            placeholder="All customers"
            defaultValue={resolvedSearchParams?.customerId}
            options={customers.map((customer) => ({
              label: customer.customer_name,
              value: customer.id,
            }))}
          />
          <Input type="date" name="from" defaultValue={resolvedSearchParams?.from} />
          <Input type="date" name="to" defaultValue={resolvedSearchParams?.to} />
          <div className="md:col-span-2 xl:col-span-5">
            <Button type="submit" variant="secondary">
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      <InvoiceList invoices={invoices.data} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Page {page} of {pageCount}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={buildPageLink(resolvedSearchParams, page - 1)}
              className="rounded-xl border border-white/10 px-3 py-2"
            >
              Previous
            </Link>
          ) : null}
          {page < pageCount ? (
            <Link
              href={buildPageLink(resolvedSearchParams, page + 1)}
              className="rounded-xl border border-white/10 px-3 py-2"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
