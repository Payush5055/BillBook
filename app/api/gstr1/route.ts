import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGSTR1Json } from "@/lib/gstr1";
import { getInvoicesForGSTR1 } from "@/lib/data/queries";
import type { BusinessProfile } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { month?: number; year?: number };
  const { month, year } = body;

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Valid month (1–12) and year are required." }, { status: 400 });
  }

  const [{ data: profileData }, invoices] = await Promise.all([
    supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    getInvoicesForGSTR1(user.id, month, year),
  ]);

  if (!profileData) {
    return NextResponse.json({ error: "Business profile not configured." }, { status: 422 });
  }

  const gstr1 = generateGSTR1Json(invoices, profileData as BusinessProfile, { month, year });
  const mm = String(month).padStart(2, "0");

  return new NextResponse(JSON.stringify(gstr1, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="GSTR1_${mm}${year}.json"`,
    },
  });
}
