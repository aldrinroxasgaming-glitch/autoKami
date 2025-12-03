-- Create auto_crafting_settings table
CREATE TABLE IF NOT EXISTS public.auto_crafting_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    operator_wallet_id uuid NOT NULL,
    is_enabled boolean NOT NULL DEFAULT false,
    recipe_id integer NOT NULL,
    amount_to_craft integer NOT NULL DEFAULT 1,
    interval_minutes integer NOT NULL DEFAULT 60,
    last_run_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT auto_crafting_settings_pkey PRIMARY KEY (id),
    CONSTRAINT auto_crafting_settings_operator_wallet_id_fkey FOREIGN KEY (operator_wallet_id) 
        REFERENCES public.operator_wallets(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auto_crafting_settings_operator_wallet_id 
    ON public.auto_crafting_settings USING btree (operator_wallet_id);

-- Add comment
COMMENT ON TABLE public.auto_crafting_settings IS 'Stores automation settings for crafting recipes per operator wallet';
