import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    invoiceId: string;
    recipientEmail: string;
    recipientName: string;
    invoiceNumber: string;
    businessName: string;
  };

  const { invoiceId, recipientEmail, recipientName, invoiceNumber, businessName } = body;

  if (!invoiceId || !recipientEmail || !invoiceNumber || !businessName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(*)")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const html = buildEmailHtml({ invoice, recipientName, businessName, invoiceNumber });

  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: recipientEmail,
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

function buildEmailHtml({
  invoice,
  recipientName,
  businessName,
  invoiceNumber,
}: {
  invoice: Record<string, unknown>;
  recipientName: string;
  businessName: string;
  invoiceNumber: string;
}) {
  const grandTotal = formatCurrency(Number(invoice.grand_total ?? 0));
  const amountDue = formatCurrency(Number(invoice.amount_due ?? 0));
  const issueDate = invoice.issue_date ? new Date(invoice.issue_date as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const status = String(invoice.status ?? "").replaceAll("_", " ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0e7490,#065f46);padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#a7f3d0;">Invoice</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">${invoiceNumber}</h1>
              <p style="margin:8px 0 0;font-size:15px;color:#6ee7b7;">${businessName}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#334155;">
                Dear <strong>${recipientName || "Valued Customer"}</strong>,
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#475569;">
                Please find your invoice details below. A PDF copy of this invoice is available in the billing portal.
                Kindly review the details and arrange payment at your earliest convenience.
              </p>

              <!-- Invoice summary card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:13px;color:#64748b;">Invoice number</span>
                        </td>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
                          <span style="font-size:13px;font-weight:600;color:#0f172a;">${invoiceNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:13px;color:#64748b;">Issue date</span>
                        </td>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
                          <span style="font-size:13px;font-weight:600;color:#0f172a;">${issueDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:13px;color:#64748b;">Status</span>
                        </td>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">
                          <span style="font-size:13px;font-weight:600;color:#0f172a;text-transform:capitalize;">${status}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0;">
                          <span style="font-size:14px;font-weight:600;color:#0f172a;">Grand total</span>
                        </td>
                        <td style="padding:12px 0 0;text-align:right;">
                          <span style="font-size:18px;font-weight:700;color:#0e7490;">${grandTotal}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0 0;">
                          <span style="font-size:13px;color:#64748b;">Balance due</span>
                        </td>
                        <td style="padding:4px 0 0;text-align:right;">
                          <span style="font-size:14px;font-weight:600;color:#dc2626;">${amountDue}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:14px;color:#64748b;">
                For any queries regarding this invoice, please contact us directly.
              </p>
              <p style="margin:0;font-size:14px;color:#64748b;">
                Thank you for your business.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">${businessName} • Sent via BillBook</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
