import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [business, customers, products, invoices, items, payments] = await Promise.all([
    supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("customers").select("*").eq("user_id", user.id),
    supabase.from("products").select("*").eq("user_id", user.id),
    supabase.from("invoices").select("*").eq("user_id", user.id),
    supabase
      .from("invoice_items")
      .select("*, invoices!inner(user_id)")
      .eq("invoices.user_id", user.id),
    supabase.from("payments").select("*").eq("user_id", user.id),
  ]);

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    business: business.data,
    customers: customers.data ?? [],
    products: products.data ?? [],
    invoices: invoices.data ?? [],
    invoice_items: (items.data ?? []).map((row) => {
      const { invoices: _ignored, ...rest } = row as Record<string, unknown> & {
        invoices?: unknown;
      };
      return rest;
    }),
    payments: payments.data ?? [],
  });
}
