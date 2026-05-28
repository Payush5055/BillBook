create extension if not exists "pgcrypto";

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.business_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  address text not null,
  gstin text,
  state text not null,
  state_code text not null check (char_length(state_code) = 2),
  phone text,
  email text,
  bank_account_name text,
  bank_name text,
  bank_account_number text,
  bank_ifsc text,
  upi_id text,
  terms_and_conditions text,
  invoice_prefix text not null default 'SSP',
  logo_url text,
  signature_url text,
  financial_year_lock_before date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  gstin text,
  address text not null,
  state text not null,
  state_code text not null check (char_length(state_code) = 2),
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  hsn_sac_code text,
  default_gst_rate numeric(5,2) not null default 18 check (default_gst_rate >= 0 and default_gst_rate <= 28),
  unit text not null,
  rate numeric(14,2) not null default 0,
  description text,
  item_type text not null check (item_type in ('goods', 'service')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  source_invoice_id uuid references public.invoices(id),
  document_type text not null check (document_type in ('gst_invoice', 'non_gst_invoice', 'quotation', 'proforma_invoice')),
  invoice_number text not null,
  sequence_number integer not null check (sequence_number > 0),
  financial_year_label text not null,
  issue_date date not null,
  due_date date,
  status text not null check (status in ('draft', 'paid', 'partially_paid', 'unpaid', 'cancelled')),
  payment_terms text,
  notes text,
  remarks text,
  place_of_supply_state_code text,
  is_inter_state boolean not null default false,
  subtotal numeric(14,2) not null default 0,
  item_discount_total numeric(14,2) not null default 0,
  invoice_discount_total numeric(14,2) not null default 0,
  taxable_amount numeric(14,2) not null default 0,
  cgst_total numeric(14,2) not null default 0,
  sgst_total numeric(14,2) not null default 0,
  igst_total numeric(14,2) not null default 0,
  total_tax_amount numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  amount_due numeric(14,2) not null default 0,
  amount_in_words text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists invoices_unique_doc_number
  on public.invoices (user_id, document_type, financial_year_label, invoice_number)
  where deleted_at is null;

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id),
  item_name text not null,
  description text,
  hsn_sac_code text,
  quantity numeric(14,2) not null default 1,
  unit text not null,
  rate numeric(14,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  discount_percent numeric(6,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  line_subtotal numeric(14,2) not null default 0,
  taxable_amount numeric(14,2) not null default 0,
  cgst_amount numeric(14,2) not null default 0,
  sgst_amount numeric(14,2) not null default 0,
  igst_amount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_date date not null,
  payment_mode text not null check (payment_mode in ('cash', 'bank_transfer', 'upi', 'cheque')),
  transaction_reference text,
  amount numeric(14,2) not null check (amount > 0),
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists customers_user_idx on public.customers(user_id) where deleted_at is null;
create index if not exists products_user_idx on public.products(user_id) where deleted_at is null;
create index if not exists invoices_user_idx on public.invoices(user_id) where deleted_at is null;
create index if not exists invoices_customer_idx on public.invoices(customer_id) where deleted_at is null;
create index if not exists payments_invoice_idx on public.payments(invoice_id) where deleted_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_business_profiles_updated_at on public.business_profiles;
create trigger set_business_profiles_updated_at
before update on public.business_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute procedure public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute procedure public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.business_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

create policy "Users can read own app user"
on public.app_users for select using (auth.uid() = id);

create policy "Users can manage own business profile"
on public.business_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own customers"
on public.customers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own products"
on public.products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own invoices"
on public.invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own invoice items"
on public.invoice_items for all using (
  exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.user_id = auth.uid()
  )
);

create policy "Users can manage own payments"
on public.payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view public.invoice_list_view as
select
  i.id,
  i.user_id,
  i.customer_id,
  c.customer_name,
  i.document_type,
  i.invoice_number,
  i.financial_year_label,
  i.issue_date,
  i.due_date,
  i.status,
  i.subtotal,
  i.taxable_amount,
  i.cgst_total,
  i.sgst_total,
  i.igst_total,
  i.grand_total,
  i.amount_paid,
  i.amount_due,
  i.total_tax_amount,
  i.created_at
from public.invoices i
join public.customers c on c.id = i.customer_id
where i.deleted_at is null;

grant select on public.invoice_list_view to authenticated;

create or replace function public.create_invoice_with_items(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_invoice_id uuid;
  item jsonb;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if auth.uid() <> (payload->>'user_id')::uuid then
    raise exception 'Forbidden';
  end if;

  insert into public.invoices (
    user_id,
    customer_id,
    source_invoice_id,
    document_type,
    invoice_number,
    sequence_number,
    financial_year_label,
    issue_date,
    due_date,
    status,
    payment_terms,
    notes,
    remarks,
    place_of_supply_state_code,
    is_inter_state,
    subtotal,
    item_discount_total,
    invoice_discount_total,
    taxable_amount,
    cgst_total,
    sgst_total,
    igst_total,
    total_tax_amount,
    grand_total,
    amount_paid,
    amount_due,
    amount_in_words
  ) values (
    (payload->>'user_id')::uuid,
    (payload->>'customer_id')::uuid,
    nullif(payload->>'source_invoice_id', '')::uuid,
    payload->>'document_type',
    payload->>'invoice_number',
    (payload->>'sequence_number')::integer,
    payload->>'financial_year_label',
    (payload->>'issue_date')::date,
    nullif(payload->>'due_date', '')::date,
    payload->>'status',
    nullif(payload->>'payment_terms', ''),
    nullif(payload->>'notes', ''),
    nullif(payload->>'remarks', ''),
    nullif(payload->>'place_of_supply_state_code', ''),
    (payload->>'is_inter_state')::boolean,
    (payload->>'subtotal')::numeric,
    (payload->>'item_discount_total')::numeric,
    (payload->>'invoice_discount_total')::numeric,
    (payload->>'taxable_amount')::numeric,
    (payload->>'cgst_total')::numeric,
    (payload->>'sgst_total')::numeric,
    (payload->>'igst_total')::numeric,
    (payload->>'total_tax_amount')::numeric,
    (payload->>'grand_total')::numeric,
    (payload->>'amount_paid')::numeric,
    (payload->>'amount_due')::numeric,
    payload->>'amount_in_words'
  )
  returning id into new_invoice_id;

  for item in select * from jsonb_array_elements(payload->'items')
  loop
    insert into public.invoice_items (
      invoice_id,
      product_id,
      item_name,
      description,
      hsn_sac_code,
      quantity,
      unit,
      rate,
      gst_rate,
      discount_percent,
      discount_amount,
      line_subtotal,
      taxable_amount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      line_total,
      sort_order
    ) values (
      new_invoice_id,
      nullif(item->>'product_id', '')::uuid,
      item->>'item_name',
      nullif(item->>'description', ''),
      nullif(item->>'hsn_sac_code', ''),
      (item->>'quantity')::numeric,
      item->>'unit',
      (item->>'rate')::numeric,
      (item->>'gst_rate')::numeric,
      (item->>'discount_percent')::numeric,
      (item->>'discount_amount')::numeric,
      (item->>'line_subtotal')::numeric,
      (item->>'taxable_amount')::numeric,
      (item->>'cgst_amount')::numeric,
      (item->>'sgst_amount')::numeric,
      (item->>'igst_amount')::numeric,
      (item->>'line_total')::numeric,
      (item->>'sort_order')::integer
    );
  end loop;

  return new_invoice_id;
end;
$$;

create or replace function public.record_invoice_payment(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_payment_id uuid;
  current_invoice public.invoices%rowtype;
  paid_total numeric(14,2);
  existing_paid_total numeric(14,2);
  next_status text;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if auth.uid() <> (payload->>'user_id')::uuid then
    raise exception 'Forbidden';
  end if;

  select * into current_invoice
  from public.invoices
  where id = (payload->>'invoice_id')::uuid
    and user_id = auth.uid()
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Invoice not found';
  end if;

  select coalesce(sum(amount), 0)
  into existing_paid_total
  from public.payments
  where invoice_id = current_invoice.id
    and deleted_at is null;

  if existing_paid_total + (payload->>'amount')::numeric > current_invoice.grand_total then
    raise exception 'Payment exceeds pending balance';
  end if;

  insert into public.payments (
    invoice_id,
    user_id,
    payment_date,
    payment_mode,
    transaction_reference,
    amount,
    notes
  ) values (
    (payload->>'invoice_id')::uuid,
    auth.uid(),
    (payload->>'payment_date')::date,
    payload->>'payment_mode',
    nullif(payload->>'transaction_reference', ''),
    (payload->>'amount')::numeric,
    nullif(payload->>'notes', '')
  )
  returning id into new_payment_id;

  select coalesce(sum(amount), 0)
  into paid_total
  from public.payments
  where invoice_id = current_invoice.id
    and deleted_at is null;

  if paid_total <= 0 then
    next_status := 'unpaid';
  elsif paid_total >= current_invoice.grand_total then
    next_status := 'paid';
  else
    next_status := 'partially_paid';
  end if;

  update public.invoices
  set
    amount_paid = paid_total,
    amount_due = greatest(current_invoice.grand_total - paid_total, 0),
    status = next_status
  where id = current_invoice.id;

  return new_payment_id;
end;
$$;

create or replace function public.duplicate_invoice_document(source_invoice_id uuid, target_document_type text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_invoice public.invoices%rowtype;
  business_profile public.business_profiles%rowtype;
  fy_label text;
  next_sequence integer;
  new_invoice_id uuid;
  prefix text;
  line_item public.invoice_items%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select * into source_invoice
  from public.invoices
  where id = source_invoice_id
    and user_id = auth.uid()
    and deleted_at is null;

  if not found then
    raise exception 'Source invoice not found';
  end if;

  select * into business_profile
  from public.business_profiles
  where user_id = auth.uid();

  if not found then
    raise exception 'Business profile not found';
  end if;

  fy_label := to_char(case when extract(month from current_date) >= 4 then current_date else current_date - interval '1 year' end, 'YY')
    || to_char(case when extract(month from current_date) >= 4 then current_date + interval '1 year' else current_date end, 'YY');

  prefix := coalesce(business_profile.invoice_prefix, 'SSP');

  select coalesce(max(sequence_number), 0) + 1
  into next_sequence
  from public.invoices
  where user_id = auth.uid()
    and financial_year_label = fy_label
    and document_type = target_document_type
    and deleted_at is null;

  insert into public.invoices (
    user_id,
    customer_id,
    source_invoice_id,
    document_type,
    invoice_number,
    sequence_number,
    financial_year_label,
    issue_date,
    due_date,
    status,
    payment_terms,
    notes,
    remarks,
    place_of_supply_state_code,
    is_inter_state,
    subtotal,
    item_discount_total,
    invoice_discount_total,
    taxable_amount,
    cgst_total,
    sgst_total,
    igst_total,
    total_tax_amount,
    grand_total,
    amount_paid,
    amount_due,
    amount_in_words
  ) values (
    auth.uid(),
    source_invoice.customer_id,
    source_invoice.id,
    target_document_type,
    prefix || '/' || fy_label || '/' || lpad(next_sequence::text, 3, '0'),
    next_sequence,
    fy_label,
    current_date,
    source_invoice.due_date,
    case when target_document_type = 'quotation' then 'draft' else 'unpaid' end,
    source_invoice.payment_terms,
    source_invoice.notes,
    source_invoice.remarks,
    source_invoice.place_of_supply_state_code,
    source_invoice.is_inter_state,
    source_invoice.subtotal,
    source_invoice.item_discount_total,
    source_invoice.invoice_discount_total,
    source_invoice.taxable_amount,
    source_invoice.cgst_total,
    source_invoice.sgst_total,
    source_invoice.igst_total,
    source_invoice.total_tax_amount,
    source_invoice.grand_total,
    0,
    source_invoice.grand_total,
    source_invoice.amount_in_words
  )
  returning id into new_invoice_id;

  for line_item in
    select * from public.invoice_items where invoice_id = source_invoice.id order by sort_order asc
  loop
    insert into public.invoice_items (
      invoice_id,
      product_id,
      item_name,
      description,
      hsn_sac_code,
      quantity,
      unit,
      rate,
      gst_rate,
      discount_percent,
      discount_amount,
      line_subtotal,
      taxable_amount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      line_total,
      sort_order
    ) values (
      new_invoice_id,
      line_item.product_id,
      line_item.item_name,
      line_item.description,
      line_item.hsn_sac_code,
      line_item.quantity,
      line_item.unit,
      line_item.rate,
      line_item.gst_rate,
      line_item.discount_percent,
      line_item.discount_amount,
      line_item.line_subtotal,
      line_item.taxable_amount,
      line_item.cgst_amount,
      line_item.sgst_amount,
      line_item.igst_amount,
      line_item.line_total,
      line_item.sort_order
    );
  end loop;

  return new_invoice_id;
end;
$$;

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload brand assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'brand-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can read brand assets"
on storage.objects for select
to public
using (bucket_id = 'brand-assets');
