"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Building2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { createBusinessAction, setActiveBusinessAction } from "@/lib/actions";
import type { Business } from "@/lib/types";

export function BusinessSwitcher({ businesses }: { businesses: Business[] }) {
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", city: "", state: "Maharashtra", pincode: "",
    gstin: "", state_code: "27", phone: "", email: "", website: "",
    bank_name: "", bank_account: "", bank_ifsc: "",
    invoice_series: "INV", invoice_format: "{series}/{YY}{MM}/{NNN}",
  });

  const handleSetActive = (id: string) => {
    startTransition(async () => {
      try {
        await setActiveBusinessAction(id);
        if (typeof window !== "undefined") {
          localStorage.setItem("active_business_id", id);
        }
        toast.success("Active business updated.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to switch business.");
      }
    });
  };

  const handleCreate = () => {
    startTransition(async () => {
      try {
        await createBusinessAction(form);
        toast.success("Business added.");
        setAddOpen(false);
        setForm({
          name: "", address: "", city: "", state: "Maharashtra", pincode: "",
          gstin: "", state_code: "27", phone: "", email: "", website: "",
          bank_name: "", bank_account: "", bank_ifsc: "",
          invoice_series: "INV", invoice_format: "{series}/{YY}{MM}/{NNN}",
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create business.");
      }
    });
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Businesses</h2>
          <p className="text-sm text-muted-foreground">Switch between businesses to change the active invoice context.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add business
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {businesses.map((biz) => (
          <div
            key={biz.id}
            className={`relative rounded-[26px] border p-5 transition-colors ${
              biz.is_active
                ? "border-emerald-400/40 bg-emerald-400/[0.05]"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {biz.is_active && (
              <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <Check className="h-3 w-3" />
                Active
              </span>
            )}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06]">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1 pr-16">
                <p className="truncate font-semibold">{biz.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {biz.gstin ?? "No GSTIN"} • {biz.city ?? biz.state ?? "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Series: {biz.invoice_series} • Counter: {biz.invoice_counter}
                </p>
              </div>
            </div>
            {!biz.is_active && (
              <Button
                type="button"
                variant="secondary"
                className="mt-4 w-full"
                disabled={pending}
                onClick={() => handleSetActive(biz.id)}
              >
                Set as Active
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add New Business"
        description="Fill in the business details. You can switch to this business after adding it."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Business name *" className="col-span-2">
              <Input placeholder="Business trading name" {...field("name")} />
            </FormField>
            <FormField label="GSTIN">
              <Input placeholder="27XXXXX..." {...field("gstin")} />
            </FormField>
            <FormField label="State code">
              <Input type="number" {...field("state_code")} />
            </FormField>
            <FormField label="Address" className="col-span-2">
              <Input {...field("address")} />
            </FormField>
            <FormField label="City">
              <Input {...field("city")} />
            </FormField>
            <FormField label="State">
              <Input {...field("state")} />
            </FormField>
            <FormField label="Pincode">
              <Input {...field("pincode")} />
            </FormField>
            <FormField label="Phone">
              <Input {...field("phone")} />
            </FormField>
            <FormField label="Email">
              <Input {...field("email")} />
            </FormField>
            <FormField label="Website">
              <Input {...field("website")} />
            </FormField>
            <FormField label="Bank name">
              <Input {...field("bank_name")} />
            </FormField>
            <FormField label="Account number">
              <Input {...field("bank_account")} />
            </FormField>
            <FormField label="IFSC">
              <Input {...field("bank_ifsc")} />
            </FormField>
            <FormField label="Invoice series">
              <Input placeholder="INV" {...field("invoice_series")} />
            </FormField>
            <FormField label="Invoice format" className="col-span-2">
              <Input placeholder="{series}/{YY}{MM}/{NNN}" {...field("invoice_format")} />
            </FormField>
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={handleCreate} disabled={pending || !form.name}>
              {pending ? "Saving..." : "Add business"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
