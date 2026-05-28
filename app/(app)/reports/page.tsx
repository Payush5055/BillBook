import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ReportsView } from "@/components/reports/reports-view";
import { Gstr1Export } from "@/components/reports/gstr1-export";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReportsSnapshot, getSessionUser } from "@/lib/data/queries";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    from?: string;
    to?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const snapshot = await getReportsSnapshot(user.id, {
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Sales, GST, status, and collections reports"
        description="Use these export-ready views for internal decisions and manual GST filing support including a GSTR-1-style table."
      />
      <Gstr1Export />
      <Card>
        <form className="grid gap-4 md:grid-cols-3">
          <Input type="date" name="from" defaultValue={resolvedSearchParams?.from} />
          <Input type="date" name="to" defaultValue={resolvedSearchParams?.to} />
          <div>
            <Button type="submit" variant="secondary">
              Apply date filter
            </Button>
          </div>
        </form>
      </Card>
      <ReportsView
        customerReport={snapshot.customerReport}
        statusReport={snapshot.statusReport}
        gstReport={snapshot.gstReport}
        payments={snapshot.payments}
      />
    </div>
  );
}
