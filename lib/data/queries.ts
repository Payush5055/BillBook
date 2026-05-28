import { subMonths, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type {
  BusinessProfile,
  Customer,
  InvoiceDetailRecord,
  Invoice,
  InvoiceListItem,
  Payment,
  PaymentListItem,
  Product,
} from "@/lib/types";
import type { GSTR1InvoiceInput } from "@/lib/gstr1";
import { financialYearFromDate, roundCurrency } from "@/lib/utils";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getCustomers(userId: string, search?: string): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,gstin.ilike.%${search}%`,
    );
  }

  const { data } = await query;
  return data ?? [];
}

export async function getProducts(userId: string, search?: string): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `item_name.ilike.%${search}%,description.ilike.%${search}%,hsn_sac_code.ilike.%${search}%`,
    );
  }

  const { data } = await query;
  return data ?? [];
}

export async function getInvoiceList(
  userId: string,
  filters: {
    search?: string;
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{ data: InvoiceListItem[]; count: number }> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  let query = supabase
    .from("invoice_list_view")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("issue_date", { ascending: false })
    .range(fromIndex, toIndex);

  if (filters.search) {
    query = query.or(
      `invoice_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`,
    );
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.customerId) query = query.eq("customer_id", filters.customerId);
  if (filters.from) query = query.gte("issue_date", filters.from);
  if (filters.to) query = query.lte("issue_date", filters.to);

  const { data, count } = await query;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getInvoiceById(
  userId: string,
  invoiceId: string,
): Promise<InvoiceDetailRecord | null> {
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(*), invoice_items(*), payments(*)")
    .eq("user_id", userId)
    .eq("id", invoiceId)
    .is("deleted_at", null)
    .maybeSingle();
  return invoice as InvoiceDetailRecord | null;
}

export async function getPayments(userId: string): Promise<PaymentListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, invoices(invoice_number)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("payment_date", { ascending: false });
  return (data ?? []) as PaymentListItem[];
}

export async function getDashboardMetrics(userId: string) {
  const supabase = await createClient();
  const monthStart = startOfMonth(new Date());
  const sixMonthsAgo = subMonths(new Date(), 5);

  const [{ data: invoices }, { data: recentInvoices }, { data: recentPayments }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id, issue_date, grand_total, amount_paid, amount_due, cgst_total, sgst_total, igst_total")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .neq("status", "cancelled"),
      supabase
        .from("invoice_list_view")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("payment_date", { ascending: false })
        .limit(5),
    ]);

  const allInvoices = (invoices ?? []) as Invoice[];
  const recentInvoiceRows = (recentInvoices ?? []) as InvoiceListItem[];
  const recentPaymentRows = (recentPayments ?? []) as Payment[];

  const currentMonthInvoices = allInvoices.filter(
    (invoice) => new Date(invoice.issue_date) >= monthStart,
  );

  const revenueChart = Array.from({ length: 6 }).map((_, index) => {
    const target = subMonths(new Date(), 5 - index);
    const fy = financialYearFromDate(target);
    const month = target.toLocaleString("en-IN", { month: "short" });
    const monthlyRevenue = allInvoices
      .filter((invoice) => {
        const date = new Date(invoice.issue_date);
        return date.getMonth() === target.getMonth() && date.getFullYear() === target.getFullYear();
      })
      .reduce((sum, invoice) => sum + invoice.grand_total, 0);

    const monthlyCollected = allInvoices
      .filter((invoice) => {
        const date = new Date(invoice.issue_date);
        return date.getMonth() === target.getMonth() && date.getFullYear() === target.getFullYear();
      })
      .reduce((sum, invoice) => sum + invoice.amount_paid, 0);

    return {
      label: `${month} FY${fy.label}`,
      revenue: roundCurrency(monthlyRevenue),
      collected: roundCurrency(monthlyCollected),
    };
  });

  const gstSummary = allInvoices
    .filter((invoice) => new Date(invoice.issue_date) >= sixMonthsAgo)
    .reduce(
      (acc, invoice) => {
        acc.cgst += invoice.cgst_total;
        acc.sgst += invoice.sgst_total;
        acc.igst += invoice.igst_total;
        return acc;
      },
      { cgst: 0, sgst: 0, igst: 0 },
    );

  return {
    totalInvoicesThisMonth: currentMonthInvoices.length,
    totalRevenue: roundCurrency(allInvoices.reduce((sum, invoice) => sum + invoice.grand_total, 0)),
    totalPending: roundCurrency(allInvoices.reduce((sum, invoice) => sum + invoice.amount_due, 0)),
    totalPaid: roundCurrency(allInvoices.reduce((sum, invoice) => sum + invoice.amount_paid, 0)),
    gstSummary: {
      cgst: roundCurrency(gstSummary.cgst),
      sgst: roundCurrency(gstSummary.sgst),
      igst: roundCurrency(gstSummary.igst),
    },
    recentInvoices: recentInvoiceRows,
    recentPayments: recentPaymentRows,
    revenueChart,
  };
}

export async function getInvoicesForGSTR1(
  userId: string,
  month: number,
  year: number,
): Promise<GSTR1InvoiceInput[]> {
  const supabase = await createClient();

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      issue_date,
      grand_total,
      taxable_amount,
      place_of_supply_state_code,
      document_type,
      is_inter_state,
      customers ( gstin, state_code ),
      invoice_items (
        hsn_sac_code,
        item_name,
        quantity,
        unit,
        gst_rate,
        taxable_amount,
        cgst_amount,
        sgst_amount,
        igst_amount,
        line_total
      )
    `)
    .eq("user_id", userId)
    .gte("issue_date", from)
    .lte("issue_date", to)
    .in("document_type", ["gst_invoice", "non_gst_invoice"])
    .neq("status", "cancelled")
    .is("deleted_at", null)
    .order("issue_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as GSTR1InvoiceInput[];
}

export async function getReportsSnapshot(
  userId: string,
  filters: {
    from?: string;
    to?: string;
  } = {},
) {
  const supabase = await createClient();
  let invoiceQuery = supabase
    .from("invoice_list_view")
    .select("*")
    .eq("user_id", userId)
    .order("issue_date", { ascending: false });

  let paymentQuery = supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (filters.from) {
    invoiceQuery = invoiceQuery.gte("issue_date", filters.from);
    paymentQuery = paymentQuery.gte("payment_date", filters.from);
  }

  if (filters.to) {
    invoiceQuery = invoiceQuery.lte("issue_date", filters.to);
    paymentQuery = paymentQuery.lte("payment_date", filters.to);
  }

  const [{ data: invoices }, { data: customers }, { data: payments }] = await Promise.all([
    invoiceQuery,
    supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null),
    paymentQuery,
  ]);

  const invoiceRows = (invoices ?? []) as InvoiceListItem[];
  const customerRows = (customers ?? []) as Customer[];
  const paymentRows = (payments ?? []) as Payment[];

  const customerReport = customerRows.map((customer) => {
    const customerInvoices = invoiceRows.filter((invoice) => invoice.customer_id === customer.id);
    return {
      customer,
      invoiceCount: customerInvoices.length,
      billed: roundCurrency(customerInvoices.reduce((sum, invoice) => sum + invoice.grand_total, 0)),
      outstanding: roundCurrency(customerInvoices.reduce((sum, invoice) => sum + invoice.amount_due, 0)),
    };
  });

  const statusReport = ["draft", "paid", "partially_paid", "unpaid", "cancelled"].map((status) => ({
    status,
    count: invoiceRows.filter((invoice) => invoice.status === status).length,
    total: roundCurrency(
      invoiceRows.filter((invoice) => invoice.status === status).reduce((sum, invoice) => sum + invoice.grand_total, 0),
    ),
  }));

  return {
    invoices: invoiceRows,
    payments: paymentRows,
    customerReport,
    statusReport,
    gstReport: {
      taxable: roundCurrency(
        invoiceRows.reduce((sum, invoice) => sum + invoice.grand_total - invoice.total_tax_amount, 0),
      ),
      cgst: roundCurrency(invoiceRows.reduce((sum, invoice) => sum + (invoice.cgst_total ?? 0), 0)),
      sgst: roundCurrency(invoiceRows.reduce((sum, invoice) => sum + (invoice.sgst_total ?? 0), 0)),
      igst: roundCurrency(invoiceRows.reduce((sum, invoice) => sum + (invoice.igst_total ?? 0), 0)),
      gstr1Rows: invoiceRows.map((invoice) => ({
        invoice_number: invoice.invoice_number,
        date: invoice.issue_date,
        customer_name: invoice.customer_name,
        taxable_value: roundCurrency(invoice.grand_total - invoice.total_tax_amount),
        tax_amount: invoice.total_tax_amount,
        total_value: invoice.grand_total,
      })),
    },
  };
}
