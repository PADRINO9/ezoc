# בון חכם

Premium Hebrew RTL MVP for smart fish-shop order management.

The app demonstrates the intended WhatsApp workflow without connecting the real WhatsApp API or OpenAI yet:

- Incoming WhatsApp-style messages are submitted through the simulator.
- The raw message is stored with the conversation.
- A rule-based parser creates a structured draft order.
- Missing details trigger a professional Hebrew system reply.
- Human approval is always required before an order becomes approved.
- Dashboard, orders, details, catalog, settings, and printable tickets are ready for a real shop demo.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

Create a Supabase Free project, then run:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Copy `.env.local.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

If Supabase env vars are not present, the app runs in demo mode with the same service layer and seeded data so the UI can still be reviewed locally.

## Architecture

- `src/lib/order-parser.ts` contains `parseCustomerOrderMessage(message, catalog, settings)`.
- `src/lib/data-store.ts` centralizes persistence and business workflow.
- `src/app/api/webhooks/whatsapp/route.ts` is the future WhatsApp webhook placeholder.
- `src/lib/supabase.ts` lazily initializes the Supabase server client.
- `supabase/schema.sql` and `supabase/seed.sql` define the real PostgreSQL model and demo seed.

## Verification

```bash
npm run lint
npm run build
```
