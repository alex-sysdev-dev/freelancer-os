-- Freelancer Finance OS core schema for Supabase.
-- Run this in the Supabase SQL editor for the project before using the app.

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_name text not null,
  type text not null default 'Uncategorized',
  starting_balance numeric(12, 2) not null default 0,
  net_transfers numeric(12, 2),
  current_balance numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  platform text not null,
  project text not null,
  hours_worked numeric(10, 2) not null default 0,
  rate_per_hour numeric(10, 2) not null default 0,
  amount numeric(12, 2) generated always as (round(hours_worked * rate_per_hour, 2)) stored,
  week_start_date date,
  one_month_forecast numeric(12, 2) not null default 0,
  two_week_forecast numeric(12, 2) not null default 0,
  six_month_forecast numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category text not null default 'Deposit',
  amount numeric(12, 2) not null,
  signed_amount numeric(12, 2) generated always as (
    case
      when lower(category) in ('withdrawal', 'expense') then -abs(amount)
      else amount
    end
  ) stored,
  source text not null default 'Manual',
  week_start_date text check (week_start_date is null or week_start_date ~ '^\d{4}-W\d{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_user_name_idx on public.accounts (user_id, account_name);
create index if not exists earnings_user_date_idx on public.earnings (user_id, date);
create index if not exists transfers_user_date_idx on public.transfers (user_id, date desc);
create index if not exists transfers_account_id_idx on public.transfers (account_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_earnings_updated_at on public.earnings;
create trigger set_earnings_updated_at
before update on public.earnings
for each row execute function public.set_updated_at();

drop trigger if exists set_transfers_updated_at on public.transfers;
create trigger set_transfers_updated_at
before update on public.transfers
for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;
alter table public.earnings enable row level security;
alter table public.transfers enable row level security;

grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.earnings to authenticated;
grant select, insert, update, delete on public.transfers to authenticated;
grant select, insert, update, delete on public.accounts to service_role;
grant select, insert, update, delete on public.earnings to service_role;
grant select, insert, update, delete on public.transfers to service_role;

drop policy if exists "Users can read own accounts" on public.accounts;
create policy "Users can read own accounts"
on public.accounts for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own accounts" on public.accounts;
create policy "Users can create own accounts"
on public.accounts for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own accounts" on public.accounts;
create policy "Users can update own accounts"
on public.accounts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own accounts" on public.accounts;
create policy "Users can delete own accounts"
on public.accounts for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own earnings" on public.earnings;
create policy "Users can read own earnings"
on public.earnings for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own earnings" on public.earnings;
create policy "Users can create own earnings"
on public.earnings for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own earnings" on public.earnings;
create policy "Users can update own earnings"
on public.earnings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own earnings" on public.earnings;
create policy "Users can delete own earnings"
on public.earnings for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own transfers" on public.transfers;
create policy "Users can read own transfers"
on public.transfers for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own transfers" on public.transfers;
create policy "Users can create own transfers"
on public.transfers for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own transfers" on public.transfers;
create policy "Users can update own transfers"
on public.transfers for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own transfers" on public.transfers;
create policy "Users can delete own transfers"
on public.transfers for delete
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.finance_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  monthly_expense_target numeric(12, 2) not null default 3200,
  tax_reserve_rate numeric(5, 4) not null default 0.25 check (tax_reserve_rate >= 0 and tax_reserve_rate <= 1),
  minimum_cash_buffer numeric(12, 2) not null default 5000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_settings_updated_at_idx on public.finance_settings (updated_at desc);

drop trigger if exists set_finance_settings_updated_at on public.finance_settings;
create trigger set_finance_settings_updated_at
before update on public.finance_settings
for each row execute function public.set_updated_at();

alter table public.finance_settings enable row level security;

grant select, insert, update, delete on public.finance_settings to authenticated;
grant select, insert, update, delete on public.finance_settings to service_role;

drop policy if exists "Users can read own finance settings" on public.finance_settings;
create policy "Users can read own finance settings"
on public.finance_settings for select
to authenticated
using (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "Users can create own finance settings" on public.finance_settings;
create policy "Users can create own finance settings"
on public.finance_settings for insert
to authenticated
with check (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "Users can update own finance settings" on public.finance_settings;
create policy "Users can update own finance settings"
on public.finance_settings for update
to authenticated
using (user_id is null or (select auth.uid()) = user_id)
with check (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "Users can delete own finance settings" on public.finance_settings;
create policy "Users can delete own finance settings"
on public.finance_settings for delete
to authenticated
using (user_id is null or (select auth.uid()) = user_id);

