import { roundCurrency } from "@/lib/utils";
import type { BusinessProfile } from "@/lib/types";

export type GSTR1InvoiceInput = {
  id: string;
  invoice_number: string;
  issue_date: string;
  grand_total: number;
  taxable_amount: number;
  place_of_supply_state_code: string | null;
  document_type: string;
  is_inter_state: boolean;
  customers: { gstin: string | null; state_code: string } | null;
  invoice_items: Array<{
    hsn_sac_code: string | null;
    item_name: string;
    quantity: number;
    unit: string;
    gst_rate: number;
    taxable_amount: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    line_total: number;
  }>;
};

function toGSTRDate(isoDate: string): string {
  const [yyyy, mm, dd] = isoDate.split("-");
  return `${dd}-${mm}-${yyyy}`;
}

function pos(invoice: GSTR1InvoiceInput): string {
  return invoice.place_of_supply_state_code ?? invoice.customers?.state_code ?? "27";
}

export function generateGSTR1Json(
  invoices: GSTR1InvoiceInput[],
  businessProfile: BusinessProfile,
  period: { month: number; year: number },
) {
  const fp = String(period.month).padStart(2, "0") + String(period.year);

  const gstInvoices = invoices.filter((inv) => inv.document_type === "gst_invoice");
  const nonGstInvoices = invoices.filter((inv) => inv.document_type === "non_gst_invoice");

  const gt = roundCurrency(gstInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0));

  // ── B2B (customer has GSTIN) ─────────────────────────────────────────────
  const b2bMap = new Map<string, GSTR1InvoiceInput[]>();
  for (const inv of gstInvoices.filter((inv) => inv.customers?.gstin)) {
    const gstin = inv.customers!.gstin!;
    if (!b2bMap.has(gstin)) b2bMap.set(gstin, []);
    b2bMap.get(gstin)!.push(inv);
  }

  const b2b = Array.from(b2bMap.entries()).map(([ctin, invList]) => ({
    ctin,
    inv: invList.map((inv) => {
      const rateMap = new Map<number, { txval: number; camt: number; samt: number; iamt: number }>();
      for (const item of inv.invoice_items) {
        const rt = Number(item.gst_rate);
        if (!rateMap.has(rt)) rateMap.set(rt, { txval: 0, camt: 0, samt: 0, iamt: 0 });
        const e = rateMap.get(rt)!;
        e.txval = roundCurrency(e.txval + Number(item.taxable_amount));
        e.camt = roundCurrency(e.camt + Number(item.cgst_amount));
        e.samt = roundCurrency(e.samt + Number(item.sgst_amount));
        e.iamt = roundCurrency(e.iamt + Number(item.igst_amount));
      }
      return {
        inum: inv.invoice_number,
        idt: toGSTRDate(inv.issue_date),
        val: roundCurrency(Number(inv.grand_total)),
        pos: pos(inv),
        rchrg: "N",
        inv_typ: "R",
        itms: Array.from(rateMap.entries()).map(([rt, v], idx) => ({
          num: idx + 1,
          itm_det: { txval: v.txval, rt, camt: v.camt, samt: v.samt, iamt: v.iamt, csamt: 0 },
        })),
      };
    }),
  }));

  // ── B2CS (customer has no GSTIN, has tax) ────────────────────────────────
  type B2CSEntry = { sply_tp: string; pos: string; rt: number; txval: number; iamt: number; camt: number; samt: number };
  const b2csMap = new Map<string, B2CSEntry>();

  for (const inv of gstInvoices.filter((inv) => !inv.customers?.gstin)) {
    for (const item of inv.invoice_items) {
      const rt = Number(item.gst_rate);
      if (rt === 0) continue;
      const stateCode = pos(inv);
      const sply_tp = inv.is_inter_state ? "INTER" : "INTRA";
      const key = `${sply_tp}|${stateCode}|${rt}`;
      if (!b2csMap.has(key)) b2csMap.set(key, { sply_tp, pos: stateCode, rt, txval: 0, iamt: 0, camt: 0, samt: 0 });
      const e = b2csMap.get(key)!;
      e.txval = roundCurrency(e.txval + Number(item.taxable_amount));
      e.iamt = roundCurrency(e.iamt + Number(item.igst_amount));
      e.camt = roundCurrency(e.camt + Number(item.cgst_amount));
      e.samt = roundCurrency(e.samt + Number(item.sgst_amount));
    }
  }

  const b2cs = Array.from(b2csMap.values()).map((e) => ({
    sply_tp: e.sply_tp,
    pos: e.pos,
    typ: "OE",
    rt: e.rt,
    txval: e.txval,
    iamt: e.iamt,
    camt: e.camt,
    samt: e.samt,
    csamt: 0,
  }));

  // ── NIL ──────────────────────────────────────────────────────────────────
  // Only non_gst_invoice document type counts; gst_invoice with ₹0 value does not.
  const nilAmt = roundCurrency(
    nonGstInvoices
      .filter((inv) => inv.document_type === "non_gst_invoice")
      .reduce((sum, inv) => sum + Number(inv.taxable_amount), 0),
  );

  // ── HSN summary ──────────────────────────────────────────────────────────
  type HsnEntry = { hsn_sc: string; desc: string; uqc: string; qty: number; val: number; txval: number; iamt: number; camt: number; samt: number };
  const hsnMap = new Map<string, HsnEntry>();

  for (const inv of gstInvoices) {
    for (const item of inv.invoice_items) {
      const code = item.hsn_sac_code?.trim() || "0000";
      if (!hsnMap.has(code)) {
        hsnMap.set(code, {
          hsn_sc: code,
          desc: item.item_name,
          uqc: item.unit?.toUpperCase() ?? "NOS",
          qty: 0, val: 0, txval: 0, iamt: 0, camt: 0, samt: 0,
        });
      }
      const e = hsnMap.get(code)!;
      e.qty = roundCurrency(e.qty + Number(item.quantity));
      e.val = roundCurrency(e.val + Number(item.line_total));
      e.txval = roundCurrency(e.txval + Number(item.taxable_amount));
      e.iamt = roundCurrency(e.iamt + Number(item.igst_amount));
      e.camt = roundCurrency(e.camt + Number(item.cgst_amount));
      e.samt = roundCurrency(e.samt + Number(item.sgst_amount));
    }
  }

  const hsnData = Array.from(hsnMap.values()).map((e, idx) => ({
    num: idx + 1,
    hsn_sc: e.hsn_sc,
    desc: e.desc,
    uqc: e.uqc,
    qty: e.qty,
    val: e.val,
    txval: e.txval,
    iamt: e.iamt,
    camt: e.camt,
    samt: e.samt,
    csamt: 0,
  }));

  return {
    version: "GST3.0.4",
    hash: "hash",
    gstin: businessProfile.gstin ?? "",
    fp,
    gt,
    cur_gt: gt,
    b2b,
    b2cs,
    nil: {
      inv: [{ sply_tp: "INTRB2B", nil_amt: nilAmt, expt_amt: 0, ngsup_amt: 0 }],
    },
    hsn: { data: hsnData },
  };
}
