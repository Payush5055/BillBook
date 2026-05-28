# BillBook

Modern GST billing and invoicing SaaS for a single Indian business owner, built with Next.js App Router, TypeScript, Tailwind, Framer Motion, Supabase, Recharts, React Hook Form, and Zod.

## Included

- Email/password auth with protected routes
- One-time business setup with GSTIN prefill and asset uploads
- Animated dashboard with revenue, pending, paid, and GST summaries
- Customer CRUD with billing history and outstanding totals
- Product and service catalog with reusable defaults
- Invoice, quotation, proforma, and non-GST document support
- Real-time GST calculations for intra-state and inter-state billing
- Payment tracking for partial and full receipts
- Invoice print and PDF download
- Reports for sales, customer balances, GST summary, status, payments, and GSTR-1-ready views
- Supabase SQL migration with RLS, indexes, and transactional RPC functions
- Backup export endpoint at `/api/export`

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- shadcn-style UI components
- Lucide icons
- Supabase Auth, Postgres, and Storage
- Recharts
- React Hook Form + Zod
- `html2canvas` + `jspdf`

## Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/001_initial_schema.sql`.
3. Enable Email auth in Supabase Authentication.
4. Confirm the `brand-assets` storage bucket exists after the migration.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Add the same three environment variables in Vercel.
4. Deploy.
5. Point your production domain if needed.

## Architecture Notes

- App routes are server-first for fast initial loads.
- Forms and motion-heavy interactions are client components.
- GST logic lives in `lib/gst.ts`.
- Supabase queries live in `lib/data/queries.ts`.
- Server actions live in `lib/actions.ts`.
- Production-ready invoice rendering lives in `components/invoices/invoice-document.tsx`.

## Future Extensions

The structure is intentionally ready for:

- e-Invoice IRN integration
- e-Way bill workflows
- GST API sync
- WhatsApp notifications
- Inventory management
- Multi-user access
- Tally exports
