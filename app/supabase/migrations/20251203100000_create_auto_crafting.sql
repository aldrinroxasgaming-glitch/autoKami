-- Create auto_crafting_settings table
create table if not exists public.auto_crafting_settings (
  id uuid not null default gen_random_uuid(),
  operator_wallet_id uuid not null,
  is_enabled boolean not null default false,
  recipe_id integer not null default 6, -- Default to recipe #6
  amount_to_craft integer not null default 1,
  interval_minutes integer not null default 60,
  last_run_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint auto_crafting_settings_pkey primary key (id),
  constraint auto_crafting_settings_operator_wallet_id_fkey foreign KEY (operator_wallet_id) references public.operator_wallets (id) on delete CASCADE,
  constraint auto_crafting_settings_operator_wallet_id_key unique (operator_wallet_id)
) TABLESPACE pg_default;

-- Create index for faster lookups
create index IF not exists idx_auto_crafting_settings_operator_wallet_id on public.auto_crafting_settings using btree (operator_wallet_id) TABLESPACE pg_default;

-- Add comment
comment on table public.auto_crafting_settings is 'Stores automation settings for crafting recipes per operator wallet';
