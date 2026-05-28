"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductForm } from "@/components/forms/product-form";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { softDeleteProductAction } from "@/lib/actions";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function CatalogManager({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return products.filter((product) =>
      [product.item_name, product.description, product.hsn_sac_code]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [products, query]);

  const deleteProduct = (id: string) => {
    startTransition(async () => {
      try {
        await softDeleteProductAction(id);
        toast.success("Item deleted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete item.");
      }
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search by item name, HSN/SAC, description..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xl"
        />
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>HSN / SAC</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.item_name}</p>
                    <p className="text-xs text-muted-foreground">{product.unit}</p>
                  </div>
                </TableCell>
                <TableCell>{product.hsn_sac_code || "—"}</TableCell>
                <TableCell className="capitalize">{product.item_type}</TableCell>
                <TableCell>{product.default_gst_rate}%</TableCell>
                <TableCell>{formatCurrency(product.rate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
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
        title={selectedProduct ? "Edit catalog item" : "Create catalog item"}
        description="Build a reusable services and product library for instant invoice autofill."
      >
        <ProductForm
          product={selectedProduct}
          onSuccess={() => {
            setOpen(false);
            setSelectedProduct(null);
          }}
          onCancel={() => {
            setOpen(false);
            setSelectedProduct(null);
          }}
        />
      </Dialog>
    </>
  );
}
