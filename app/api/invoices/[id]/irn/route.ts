import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as { irn?: string; ack_number?: string; ack_date?: string };
  const { irn, ack_number, ack_date } = body;

  if (!irn || irn.length !== 64) {
    return NextResponse.json({ error: "IRN must be exactly 64 characters." }, { status: 400 });
  }
  if (!ack_number?.trim()) {
    return NextResponse.json({ error: "Acknowledgement Number is required." }, { status: 400 });
  }
  if (!ack_date?.trim()) {
    return NextResponse.json({ error: "Acknowledgement Date is required." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("invoices")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .update({
      irn,
      ack_number,
      ack_date,
      irn_generated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, invoice });
}
