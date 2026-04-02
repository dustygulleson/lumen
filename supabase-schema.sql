-- Enable UUID extension
create extension if not exists "pgcrypto";

-- INVENTORY
create table inventory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  category text default 'General',
  unit text default 'ea',
  qty numeric default 0,
  cost_per_unit numeric default 0,
  last_bought date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- JOBS (one row per client)
create table jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_name text not null,
  status text default 'active' check (status in ('active', 'complete')),
  created_at timestamptz default now()
);

-- JOB ITEMS (one row per material usage entry)
create table job_items (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs on delete cascade not null,
  logged_date date default current_date,
  item_name text not null,
  qty numeric not null,
  unit_cost numeric not null,
  markup_pct numeric default 20,
  billable numeric generated always as (
    round((qty * unit_cost * (1 + markup_pct / 100.0))::numeric, 2)
  ) stored,
  created_at timestamptz default now()
);

-- RECEIPTS (one row per store visit / photo)
create table receipts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  store text default 'Store',
  receipt_date date default current_date,
  image_url text,
  created_at timestamptz default now()
);

-- RECEIPT ITEMS (line items parsed from receipt)
create table receipt_items (
  id uuid default gen_random_uuid() primary key,
  receipt_id uuid references receipts on delete cascade not null,
  item_name text not null,
  qty numeric not null,
  unit_cost numeric not null,
  created_at timestamptz default now()
);

-- UPDATED_AT trigger for inventory
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger inventory_updated_at
  before update on inventory
  for each row execute function update_updated_at();

-- ROW LEVEL SECURITY — users only see their own data
alter table inventory enable row level security;
alter table jobs enable row level security;
alter table job_items enable row level security;
alter table receipts enable row level security;
alter table receipt_items enable row level security;

create policy "own inventory" on inventory for all using (auth.uid() = user_id);
create policy "own jobs" on jobs for all using (auth.uid() = user_id);
create policy "own job_items" on job_items for all
  using (job_id in (select id from jobs where user_id = auth.uid()));
create policy "own receipts" on receipts for all using (auth.uid() = user_id);
create policy "own receipt_items" on receipt_items for all
  using (receipt_id in (select id from receipts where user_id = auth.uid()));

-- INDEXES for common queries
create index on inventory (user_id, name);
create index on jobs (user_id, client_name);
create index on job_items (job_id, logged_date);
create index on receipts (user_id, receipt_date desc);
