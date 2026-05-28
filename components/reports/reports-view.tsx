import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type ReportsViewProps = {
  customerReport: Array<{
    customer: { customer_name: string };
    invoiceCount: number;
    billed: number;
    outstanding: number;
  }>;
  statusReport: Array<{ status: string; count: number; total: number }>;
  gstReport: {
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstr1Rows: Array<{
      invoice_number: string;
      date: string;
      customer_name: string;
      taxable_value: number;
      tax_amount: number;
      total_value: number;
    }>;
  };
  payments: Array<{ payment_date: string; amount: number; payment_mode: string }>;
};

export function ReportsView({
  customerReport,
  statusReport,
  gstReport,
  payments,
}: ReportsViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground">Taxable sales</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(gstReport.taxable)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">CGST</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(gstReport.cgst)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">SGST</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(gstReport.sgst)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">IGST</p>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(gstReport.igst)}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-0">
          <div className="border-b border-white/10 p-6">
            <h3 className="text-lg font-semibold">Customer-wise report</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Billed</TableHead>
                <TableHead>Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerReport.map((row) => (
                <TableRow key={row.customer.customer_name}>
                  <TableCell>{row.customer.customer_name}</TableCell>
                  <TableCell>{row.invoiceCount}</TableCell>
                  <TableCell>{formatCurrency(row.billed)}</TableCell>
                  <TableCell>{formatCurrency(row.outstanding)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-0">
          <div className="border-b border-white/10 p-6">
            <h3 className="text-lg font-semibold">Invoice status report</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statusReport.map((row) => (
                <TableRow key={row.status}>
                  <TableCell className="capitalize">{row.status.replaceAll("_", " ")}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{formatCurrency(row.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="p-0">
        <div className="border-b border-white/10 p-6">
          <h3 className="text-lg font-semibold">GSTR-1-ready view</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Export-friendly line items for manual filing.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Taxable value</TableHead>
              <TableHead>Tax amount</TableHead>
              <TableHead>Total value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gstReport.gstr1Rows.map((row) => (
              <TableRow key={row.invoice_number}>
                <TableCell>{row.invoice_number}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.customer_name}</TableCell>
                <TableCell>{formatCurrency(row.taxable_value)}</TableCell>
                <TableCell>{formatCurrency(row.tax_amount)}</TableCell>
                <TableCell>{formatCurrency(row.total_value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-0">
        <div className="border-b border-white/10 p-6">
          <h3 className="text-lg font-semibold">Payment report</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment, index) => (
              <TableRow key={`${payment.payment_date}-${index}`}>
                <TableCell>{payment.payment_date}</TableCell>
                <TableCell className="capitalize">{payment.payment_mode.replaceAll("_", " ")}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
