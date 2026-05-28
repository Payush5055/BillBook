import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPayments, getSessionUser } from "@/lib/data/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PaymentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const payments = await getPayments(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="Collections"
        title="Payment tracking"
        description="Monitor partial and full receipts, references, modes, and invoice-wise collections in one clean ledger."
      />
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell className="capitalize">{payment.payment_mode.replaceAll("_", " ")}</TableCell>
                <TableCell>{payment.transaction_reference || "—"}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{payment.invoices?.invoice_number || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
