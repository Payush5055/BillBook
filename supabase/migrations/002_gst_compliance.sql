-- Migration: GST compliance fields
-- Applied via Supabase MCP on 2026-05-31

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS hsn_code TEXT;

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS place_of_supply TEXT DEFAULT 'Maharashtra';

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS irn TEXT,
ADD COLUMN IF NOT EXISTS ack_number TEXT,
ADD COLUMN IF NOT EXISTS ack_date TEXT,
ADD COLUMN IF NOT EXISTS irn_generated_at TIMESTAMPTZ;
