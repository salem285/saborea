-- ============================================================================
-- SABOREA Restaurant - Production Database Schema, RLS, Realtime & Initial Setup
-- ============================================================================

-- 1. Extensions
create extension if not exists pgcrypto;

-- 2. Categories Table (Dynamic Menu Categories managed from Admin)
create table if not exists public.categories (
  id text primary key,
  slug text not null unique,
  label text not null,
  image text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Menu Items Table
create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  price integer not null check (price > 0),
  category text not null,
  image text not null,
  sold integer not null default 0,
  created_at timestamptz not null default now()
);

-- Drop legacy 4-category check constraint if present so Admin can add 14+ categories freely
alter table public.menu_items drop constraint if exists menu_items_category_check;

-- 4. Restaurant Tables (Table 01 to Table 10+)
create table if not exists public.restaurant_tables (
  id text primary key,
  table_number text not null unique,
  status text not null default 'Available' check (status in ('Available', 'Preparing', 'Ready')),
  is_demo boolean not null default false,
  display_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 5. Orders Table
create table if not exists public.orders (
  id text primary key,
  table_id text references public.restaurant_tables(id) on delete set null,
  table_number text not null,
  total integer not null default 0,
  status text not null default 'Preparing' check (status in ('Preparing', 'Ready', 'Completed')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. Order Items Table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  menu_item_id text references public.menu_items(id) on delete set null,
  name text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  image text not null,
  line_total_override integer,
  created_at timestamptz not null default now()
);

-- 7. Guest Reviews Table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  initials text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_menu_items_category on public.menu_items(category);
create index if not exists idx_orders_table_id on public.orders(table_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

-- 8. Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Allow all operations on categories" on public.categories;
create policy "Allow all operations on categories"
  on public.categories for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow all operations on menu_items" on public.menu_items;
create policy "Allow all operations on menu_items"
  on public.menu_items for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow all operations on restaurant_tables" on public.restaurant_tables;
create policy "Allow all operations on restaurant_tables"
  on public.restaurant_tables for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow all operations on orders" on public.orders;
create policy "Allow all operations on orders"
  on public.orders for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow all operations on order_items" on public.order_items;
create policy "Allow all operations on order_items"
  on public.order_items for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow all operations on reviews" on public.reviews;
create policy "Allow all operations on reviews"
  on public.reviews for all to anon, authenticated using (true) with check (true);

-- 9. Enable Supabase Realtime safely
do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.restaurant_tables;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.menu_items;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.order_items;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.categories;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.reviews;
  exception when duplicate_object then null;
  end;
end $$;

-- 10. Initial Production Tables (Table 01 to Table 10) & Base Categories
insert into public.categories (id, slug, label, image, display_order)
values
  ('cat-pizza', 'pizza', 'Pizza', '/images/food/margherita.jpg', 1),
  ('cat-savory', 'savory', 'Savory', '/images/food/savory-salmon.jpg', 2),
  ('cat-sweets', 'sweets', 'Sweets', '/images/food/lava-cake.jpg', 3),
  ('cat-drinks', 'drinks', 'Drinks', '/images/food/cola.jpg', 4)
on conflict (slug) do nothing;

insert into public.restaurant_tables (id, table_number, status, is_demo, display_order, updated_at)
values
  ('table-01', 'Table 01', 'Available', false, 1, now()),
  ('table-02', 'Table 02', 'Available', false, 2, now()),
  ('table-03', 'Table 03', 'Available', false, 3, now()),
  ('table-04', 'Table 04', 'Available', false, 4, now()),
  ('table-05', 'Table 05', 'Available', false, 5, now()),
  ('table-06', 'Table 06', 'Available', false, 6, now()),
  ('table-07', 'Table 07', 'Available', false, 7, now()),
  ('table-08', 'Table 08', 'Available', false, 8, now()),
  ('table-09', 'Table 09', 'Available', false, 9, now()),
  ('table-10', 'Table 10', 'Available', false, 10, now())
on conflict (id) do nothing;
