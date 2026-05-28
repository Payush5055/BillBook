import Link from "next/link";
import { ArrowRight, Clock3, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBusinessProfile, getDashboardMetrics, getSessionUser } from "@/lib/data/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const businessProfile = await getBusinessProfile(user.id);
  if (!businessProfile) redirect("/setup");

  const metrics = await getDashboardMetrics(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Premium GST billing at a glance"
        description="Track revenue, receivables, tax exposure, and recent billing activity from one responsive dashboard."
        action={
          <Button asChild>
            <Link href="/invoices/new" className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Quick create invoice
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard index={0} title="Invoices this month" value={metrics.totalInvoicesThisMonth} icon="receipt" hint="Live month-to-date document volume." />
        <MetricCard index={1} title="Total revenue" value={metrics.totalRevenue} icon="revenue" currency hint="Gross billed value across invoices." />
        <MetricCard index={2} title="Pending amount" value={metrics.totalPending} icon="wallet" currency hint="Outstanding customer receivables." />
        <MetricCard index={3} title="Collected amount" value={metrics.totalPaid} icon="payment" currency hint="Payments successfully recorded." />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Revenue trend</p>
              <h3 className="mt-2 text-2xl font-semibold">Billing and collections by month</h3>
            </div>
            <Badge>Animated analytics</Badge>
          </div>
          <RevenueChart data={metrics.revenueChart} />
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">GST summary</p>
            <h3 className="mt-2 text-2xl font-semibold">Recent tax visibility</h3>
          </div>
          <TaxRow label="CGST" value={metrics.gstSummary.cgst} />
          <TaxRow label="SGST" value={metrics.gstSummary.sgst} />
          <TaxRow label="IGST" value={metrics.gstSummary.igst} />
          <Link href="/reports" className="inline-flex items-center text-sm font-medium text-cyan-200">
            Open reports
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent invoices</p>
              <h3 className="mt-2 text-xl font-semibold">Latest billing activity</h3>
            </div>
            <Link href="/invoices" className="text-sm text-cyan-200">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {metrics.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(invoice.grand_total)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(invoice.issue_date)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-400/10 p-3">
              <Clock3 className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent payments</p>
              <h3 className="mt-2 text-xl font-semibold">Collections timeline</h3>
            </div>
          </div>
          <div className="space-y-3">
            {metrics.recentPayments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize">{payment.payment_mode.replaceAll("_", " ")}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(payment.payment_date)}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TaxRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );
}
