"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const MONTHS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const YEARS = [2024, 2025, 2026, 2027];

const SELECT_CLS =
  "h-9 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400";

type Summary = { invoiceCount: number; total: number };

export function Gstr1Export() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setSummary(null);
    try {
      const response = await fetch("/api/gstr1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Export failed.");
      }

      const data = await response.json() as {
        gt?: number;
        b2b?: Array<{ inv: unknown[] }>;
        b2cs?: unknown[];
      };

      const b2bCount = data.b2b?.reduce((sum, b) => sum + b.inv.length, 0) ?? 0;
      const b2csCount = data.b2cs?.length ?? 0;
      setSummary({ invoiceCount: b2bCount + b2csCount, total: data.gt ?? 0 });

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GSTR1_${String(month).padStart(2, "0")}${year}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("GSTR-1 JSON downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">GST return filing</p>
          <h3 className="mt-1 text-xl font-semibold">GSTR-1 JSON Export</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a GSTN-compatible JSON file for direct upload to the GST portal.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Month</label>
          <select
            className={SELECT_CLS}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Year</label>
          <select
            className={SELECT_CLS}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleExport} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Generating…" : "Generate GSTR-1 JSON"}
        </Button>
      </div>

      {summary ? (
        <div className="mt-4 flex flex-wrap gap-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm">
          <div>
            <p className="text-muted-foreground">Invoices in period</p>
            <p className="mt-1 text-lg font-semibold">{summary.invoiceCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total taxable turnover</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.total)}</p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
