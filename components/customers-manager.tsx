"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CustomerForm } from "@/components/forms/customer-form";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { softDeleteCustomerAction } from "@/lib/actions";
import type { Customer, InvoiceListItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function CustomersManager({
  customers,
  invoiceHistory,
}: {
  customers: Customer[];
  invoiceHistory: InvoiceListItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return customers.filter((customer) =>
      [customer.customer_name, customer.email, customer.phone, customer.gstin]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [customers, query]);

  const outstandingByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    invoiceHistory.forEach((invoice) => {
      map.set(invoice.customer_id, (map.get(invoice.customer_id) ?? 0) + invoice.amount_due);
    });
    return map;
  }, [invoiceHistory]);

  const invoiceCountByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    invoiceHistory.forEach((invoice) => {
      map.set(invoice.customer_id, (map.get(invoice.customer_id) ?? 0) + 1);
    });
    return map;
  }, [invoiceHistory]);

  const deleteCustomer = (id: string) => {
    startTransition(async () => {
      try {
        await softDeleteCustomerAction(id);
        toast.success("Customer deleted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete customer.");
      }
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search customers by name, GSTIN, email..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xl"
        />
        <Button
          onClick={() => {
            setSelectedCustomer(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add customer
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{customer.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.state} • {customer.state_code}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{customer.gstin || "—"}</TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    <p>{customer.email || "No email"}</p>
                    <p>{customer.phone || "No phone"}</p>
                  </div>
                </TableCell>
                <TableCell>{invoiceCountByCustomer.get(customer.id) ?? 0}</TableCell>
                <TableCell>{formatCurrency(outstandingByCustomer.get(customer.id) ?? 0)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCustomer(customer.id)}
                      disabled={pending}
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
        open={open}
        onOpenChange={setOpen}
        title={selectedCustomer ? "Edit customer" : "Create customer"}
        description="Store reusable billing information and customer context."
      >
        <CustomerForm
          customer={selectedCustomer}
          onSuccess={() => {
            setOpen(false);
            setSelectedCustomer(null);
          }}
        />
      </Dialog>
    </>
  );
}
