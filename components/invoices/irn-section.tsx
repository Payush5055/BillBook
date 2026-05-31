"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

type Props = {
  invoiceId: string;
  initialIrn: string | null;
  initialAckNumber: string | null;
  initialAckDate: string | null;
};

export function IrnSection({ invoiceId, initialIrn, initialAckNumber, initialAckDate }: Props) {
  const [irn, setIrn] = useState(initialIrn ?? "");
  const [ackNumber, setAckNumber] = useState(initialAckNumber ?? "");
  const [ackDate, setAckDate] = useState(initialAckDate ?? "");
  const [saved, setSaved] = useState(!!initialIrn);
  const [editing, setEditing] = useState(false);
  const [irnError, setIrnError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!saved || !irn) return;
    import("qrcode").then((QR) => {
      QR.default
        .toDataURL(irn, { width: 120, margin: 1 })
        .then((url: string) => setQrUrl(url))
        .catch(() => {});
    });
  }, [saved, irn]);

  const handleSave = () => {
    if (irn.length !== 64) {
      setIrnError("IRN must be exactly 64 characters.");
      return;
    }
    if (!ackNumber.trim()) {
      toast.error("Acknowledgement Number is required.");
      return;
    }
    if (!ackDate) {
      toast.error("Acknowledgement Date is required.");
      return;
    }
    setIrnError("");

    startTransition(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/irn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ irn, ack_number: ackNumber, ack_date: ackDate }),
        });
        const data = await res.json() as { success?: boolean; error?: string };
        if (!res.ok || !data.success) throw new Error(data.error ?? "Save failed.");
        toast.success("IRN saved successfully");
        setSaved(true);
        setEditing(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to save IRN.");
      }
    });
  };

  if (saved && !editing) {
    const short = irn.length > 16 ? `${irn.slice(0, 8)}...${irn.slice(-8)}` : irn;
    return (
      <Card className="no-print space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold">e-Invoice Verified</h3>
              <p className="text-sm text-muted-foreground">IRN registered on GSTN portal</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-3 w-3" />
            Edit
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">IRN: </span>
              <span className="font-mono">{short}</span>
            </div>
            {ackNumber && (
              <div>
                <span className="text-muted-foreground">Ack No: </span>
                <span>{ackNumber}</span>
              </div>
            )}
            {ackDate && (
              <div>
                <span className="text-muted-foreground">Ack Date: </span>
                <span>{ackDate}</span>
              </div>
            )}
          </div>
          {qrUrl && (
            <div className="flex flex-col items-center gap-1">
              <img src={qrUrl} alt="e-Invoice QR" width={120} height={120} />
              <p className="text-xs text-muted-foreground">Scan to verify</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="no-print space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-400" />
        <div>
          <h3 className="font-semibold">e-Invoice (IRN)</h3>
          <p className="text-sm text-muted-foreground">
            This invoice is not yet registered on the government e-invoice portal. Generate IRN on{" "}
            <span className="text-cyan-300">einvoice1.gst.gov.in</span> and enter the details below.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="IRN" className="md:col-span-2" error={irnError}>
          <Input
            value={irn}
            onChange={(e) => {
              setIrn(e.target.value);
              if (irnError) setIrnError("");
            }}
            onBlur={() => {
              if (irn && irn.length !== 64) setIrnError("IRN must be exactly 64 characters.");
            }}
            placeholder="64-character IRN from NIC portal"
            maxLength={64}
          />
          <p className="mt-1 text-xs text-muted-foreground">{irn.length}/64 characters</p>
        </FormField>
        <FormField label="Acknowledgement Number">
          <Input
            value={ackNumber}
            onChange={(e) => setAckNumber(e.target.value)}
            placeholder="e.g. 112024123456789"
          />
        </FormField>
        <FormField label="Acknowledgement Date">
          <Input
            type="date"
            value={ackDate}
            onChange={(e) => setAckDate(e.target.value)}
          />
        </FormField>
      </div>

      <div className="flex gap-3">
        <Button type="button" onClick={handleSave} disabled={pending}>
          {pending ? "Saving..." : "Save IRN Details"}
        </Button>
        {editing && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}
