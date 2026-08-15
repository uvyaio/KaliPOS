-- ============================================================================
-- KaliPOS database schema
-- ============================================================================
-- This is a SINGLE-RESTAURANT schema: it assumes one restaurant per Supabase
-- project, the same pattern used in Michael's other Kalitec projects. If you
-- later want to support many restaurants in one database, you'd add a
-- `restaurant_id` column to every table below.
--
-- How to run this: paste the whole file into the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New query) and click "Run". It's also applied
-- automatically the first time Claude sets up your project.
-- ============================================================================

-- Lets us generate random UUIDs for primary keys.
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- STAFF
-- Owners/managers sign in with Supabase Auth (email + password), so their
-- row links to auth.users via auth_user_id. Waiters/cashiers sign in with
-- phone + 4-digit PIN instead (no email needed) so auth_user_id is null for them.
-- ----------------------------------------------------------------------------
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text unique,              -- e.g. "254712345678", used for staff PIN login
  pin_hash text,                  -- bcrypt hash of the 4-digit PIN, never store it plain
  role text not null default 'cashier' check (role in ('owner', 'manager', 'cashier', 'waiter')),
  branch_name text default 'Main Branch',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- MENU: categories + items
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  image_url text,
  icon text,                      -- Material Symbols icon name, used when there's no photo
  is_available boolean not null default true,       -- master on/off switch
  available_days text[] not null default array['mon','tue','wed','thu','fri','sat','sun'],
  is_popular boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ORDERS + ORDER ITEMS (the shopping cart, once it's "sent" from the POS screen)
-- ----------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,      -- e.g. "K-8492", shown to staff
  status text not null default 'open' check (status in ('open', 'awaiting_payment', 'paid', 'cancelled')),
  order_type text not null default 'dine_in' check (order_type in ('dine_in', 'takeaway', 'delivery')),
  table_number text,
  subtotal numeric(10, 2) not null default 0,
  vat numeric(10, 2) not null default 0,          -- 16% VAT
  catering_levy numeric(10, 2) not null default 0, -- 2% catering levy
  total numeric(10, 2) not null default 0,
  customer_name text,
  customer_phone text,
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name_snapshot text not null,     -- copy of the item name at time of order (in case menu changes later)
  unit_price numeric(10, 2) not null,
  quantity int not null default 1,
  notes text
);

-- ----------------------------------------------------------------------------
-- M-PESA TRANSACTIONS
-- One row per STK Push request. Created the moment we call Safaricom's API,
-- then updated by the mpesa-callback Edge Function when Safaricom confirms
-- (or fails) the payment.
-- ----------------------------------------------------------------------------
create table if not exists mpesa_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  checkout_request_id text unique,   -- Safaricom's ID for this STK push
  merchant_request_id text,
  phone text not null,               -- customer's phone, format 2547XXXXXXXX
  amount numeric(10, 2) not null,
  mpesa_receipt text,                -- e.g. "RKG8Z2RN6P", filled in on success
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'timeout')),
  result_desc text,
  customer_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- INVENTORY
-- ----------------------------------------------------------------------------
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'Ingredients',
  unit text not null default 'units',
  current_stock numeric(10, 2) not null default 0,
  unit_cost numeric(10, 2) not null default 0,
  reorder_point numeric(10, 2) not null default 10,
  avg_daily_usage numeric(10, 2) not null default 0,
  last_restocked_at date,
  last_restocked_qty numeric(10, 2),
  vendor_name text,
  vendor_lead_time_days int,
  vendor_min_order numeric(10, 2),
  icon text default 'inventory_2',
  created_at timestamptz not null default now()
);

create table if not exists inventory_usage_log (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  used_on date not null default current_date,
  quantity_used numeric(10, 2) not null,
  reason text default 'sale' check (reason in ('sale', 'waste_expired', 'waste_prep_error', 'waste_damaged', 'restock'))
);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- For a first working version we keep RLS OFF (same as Michael's SchoolOS
-- setup during development) so the app can read/write freely with the anon
-- key. Before going to production, turn RLS on and write policies that check
-- `auth.uid()` against the staff table.
-- ----------------------------------------------------------------------------
alter table staff disable row level security;
alter table categories disable row level security;
alter table menu_items disable row level security;
alter table orders disable row level security;
alter table order_items disable row level security;
alter table mpesa_transactions disable row level security;
alter table inventory_items disable row level security;
alter table inventory_usage_log disable row level security;

-- ----------------------------------------------------------------------------
-- Seed data - so the app has something to show the first time you open it.
-- ----------------------------------------------------------------------------
insert into categories (name, sort_order) values
  ('Mains', 1), ('Appetizers', 2), ('Drinks', 3), ('Sides', 4)
on conflict do nothing;

insert into menu_items (category_id, name, description, price, icon, is_popular)
select id, 'Classic Cheeseburger', 'Beef patty, cheddar, lettuce, brioche bun', 850, 'lunch_dining', true
from categories where name = 'Mains'
union all
select id, 'Margherita Pizza', 'Fresh basil, mozzarella, wood-fired crust', 1200, 'local_pizza', true
from categories where name = 'Mains'
union all
select id, 'Grilled Tilapia', 'Whole tilapia, lemon, kachumbari', 1800, 'set_meal', false
from categories where name = 'Mains'
union all
select id, 'Truffle Fries', 'Hand-cut fries, truffle oil, parmesan', 600, 'tapas', false
from categories where name = 'Sides'
union all
select id, 'Iced Latte', 'Espresso, milk, ice, oat-milk option', 450, 'local_cafe', true
from categories where name = 'Drinks'
on conflict do nothing;

insert into inventory_items (name, category, unit, current_stock, unit_cost, reorder_point, avg_daily_usage, last_restocked_at, last_restocked_qty, vendor_name, vendor_lead_time_days, vendor_min_order, icon)
values
  ('Tilapia Fillets', 'Ingredients', 'units', 8, 1550, 10, 4.2, current_date - interval '3 days', 12, 'Lake Fresh Suppliers', 2, 10, 'set_meal'),
  ('Pizza Dough (Bases)', 'Ingredients', 'units', 12, 120, 20, 8, current_date - interval '1 day', 30, 'Nairobi Bakers Co-op', 1, 20, 'local_pizza'),
  ('Fresh Basil', 'Ingredients', 'bunches', 6, 80, 8, 3, current_date - interval '2 days', 10, 'Green Valley Farms', 1, 5, 'grass')
on conflict do nothing;
