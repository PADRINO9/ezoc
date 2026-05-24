create extension if not exists "pgcrypto";

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text unique not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  phone text not null,
  status text not null default 'open',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  direction text not null check (direction in ('incoming', 'outgoing')),
  text text not null,
  timestamp timestamp with time zone not null default now(),
  source text not null check (source in ('simulator', 'whatsapp_future', 'system')),
  created_at timestamp with time zone not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references customers(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  status text not null check (
    status in (
      'draft_from_whatsapp',
      'missing_details',
      'pending_review',
      'approved',
      'in_preparation',
      'ready',
      'picked_up',
      'cancelled',
      'human_review'
    )
  ),
  pickup_date date,
  pickup_date_text text,
  pickup_time text,
  urgency text not null default 'normal' check (urgency in ('normal', 'urgent')),
  raw_messages jsonb not null default '[]'::jsonb,
  ai_confidence numeric not null default 0,
  missing_fields jsonb not null default '[]'::jsonb,
  human_review_required boolean not null default true,
  notes text,
  customer_notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_name text not null,
  quantity numeric,
  unit text not null check (unit in ('kg', 'unit', 'tray', 'unknown')),
  cut_style text,
  notes text not null default '',
  created_at timestamp with time zone not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aliases jsonb not null default '[]'::jsonb,
  cut_options jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'בון חכם Demo',
  opening_hours jsonb not null default '{}'::jsonb,
  pickup_windows jsonb not null default '[]'::jsonb,
  after_hours_auto_reply text not null default 'קיבלנו את ההזמנה. החנות תאשר אותה בשעות הפעילות.',
  minimum_confidence_threshold numeric not null default 85,
  require_human_approval boolean not null default true,
  default_ai_order_status text not null default 'pending_review',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_conversations_phone on conversations(phone);
create index if not exists idx_messages_conversation_timestamp on messages(conversation_id, timestamp);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_pickup on orders(pickup_date, pickup_time);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_products_active on products(active);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_customers_updated_at on customers;
create trigger set_customers_updated_at
before update on customers
for each row execute function set_updated_at();

drop trigger if exists set_conversations_updated_at on conversations;
create trigger set_conversations_updated_at
before update on conversations
for each row execute function set_updated_at();

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at
before update on orders
for each row execute function set_updated_at();

drop trigger if exists set_products_updated_at on products;
create trigger set_products_updated_at
before update on products
for each row execute function set_updated_at();

drop trigger if exists set_settings_updated_at on settings;
create trigger set_settings_updated_at
before update on settings
for each row execute function set_updated_at();

alter table customers enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table products enable row level security;
alter table settings enable row level security;

-- MVP policy: authenticated shop users can manage all rows.
-- For server-only demo usage, prefer SUPABASE_SERVICE_ROLE_KEY in the Next.js environment.
drop policy if exists "authenticated manage customers" on customers;
create policy "authenticated manage customers" on customers for all to authenticated using (true) with check (true);

drop policy if exists "authenticated manage conversations" on conversations;
create policy "authenticated manage conversations" on conversations for all to authenticated using (true) with check (true);

drop policy if exists "authenticated manage messages" on messages;
create policy "authenticated manage messages" on messages for all to authenticated using (true) with check (true);

drop policy if exists "authenticated manage orders" on orders;
create policy "authenticated manage orders" on orders for all to authenticated using (true) with check (true);

drop policy if exists "authenticated manage order_items" on order_items;
create policy "authenticated manage order_items" on order_items for all to authenticated using (true) with check (true);

drop policy if exists "authenticated manage products" on products;
create policy "authenticated manage products" on products for all to authenticated using (true) with check (true);

drop policy if exists "authenticated manage settings" on settings;
create policy "authenticated manage settings" on settings for all to authenticated using (true) with check (true);
